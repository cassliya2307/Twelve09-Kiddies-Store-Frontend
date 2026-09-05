'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { getOrder, getPaymentForOrder, initializePaystackPayment } from '@/lib/api';
import { ProductImage } from '@/components/ui/ProductImage';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Order, Payment, OrderStatus, FulfillmentMethod } from '@/types/api';

const formatPrice = (price: number | string) => {
  return Number(price).toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusBadge = (status: OrderStatus) => {
  switch (status) {
    case 'PENDING':
      return { variant: 'warning' as const, label: 'Pending' };
    case 'CONFIRMED':
      return { variant: 'info' as const, label: 'Confirmed' };
    case 'PROCESSING':
      return { variant: 'info' as const, label: 'Processing' };
    case 'READY_FOR_PICKUP':
      return { variant: 'info' as const, label: 'Ready for Pickup' };
    case 'OUT_FOR_DELIVERY':
      return { variant: 'info' as const, label: 'Out for Delivery' };
    case 'COMPLETED':
      return { variant: 'success' as const, label: 'Completed' };
    case 'CANCELLED':
      return { variant: 'danger' as const, label: 'Cancelled' };
    default:
      return { variant: 'default' as const, label: status };
  }
};

const getPaymentStatusBadge = (status: string) => {
  switch (status) {
    case 'PENDING':
      return { variant: 'warning' as const, label: 'Pending' };
    case 'SUCCESS':
      return { variant: 'success' as const, label: 'Paid' };
    case 'FAILED':
      return { variant: 'danger' as const, label: 'Failed' };
    case 'REFUNDED':
      return { variant: 'info' as const, label: 'Refunded' };
    default:
      return { variant: 'default' as const, label: status };
  }
};

const getFulfillmentLabel = (method: FulfillmentMethod) => {
  switch (method) {
    case 'STORE_PICKUP':
      return 'Store Pickup';
    case 'STORE_DELIVERY':
      return 'Store Delivery';
    case 'CUSTOMER_DISPATCH':
      return 'Customer Dispatch';
    default:
      return method;
  }
};

export function OrderConfirmationContent() {
  const params = useParams();
  const { user, refreshUser } = useAuth();
  const { clearCart } = useCart();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const [retryingPayment, setRetryingPayment] = useState(false);

  // Guard against duplicate retry submissions
  const isRetryingRef = useRef(false);
  
  // Polling for payment status
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCountRef = useRef(0);
  const MAX_POLL_ATTEMPTS = 20;
  const POLL_INTERVAL = 3000; // 3 seconds

  useEffect(() => {
    let cancelled = false;

    const fetchOrder = async () => {
      const id = parseInt(params.id as string, 10);
      if (isNaN(id)) {
        setError('Invalid order ID');
        setLoading(false);
        return;
      }

      try {
        // Verify user is authenticated
        if (!user) {
          await refreshUser();
        }
        
        const [orderData, paymentData] = await Promise.all([
          getOrder(id),
          getPaymentForOrder(id),
        ]);
        
        if (cancelled) return;
        
        // Verify order belongs to current user
        if (orderData.user_id !== user?.id) {
          setError('Order not found');
          setLoading(false);
          return;
        }
        
        setOrder(orderData);
        setPayment(paymentData);
        
        // Start polling ONLY for pending online (Paystack) payments whose webhook
        // may not have arrived yet. CASH payments stay PENDING by design until
        // staff confirm receipt — they must NOT be polled or shown as "processing".
        if (paymentData?.status === 'PENDING' && paymentData.provider === 'paystack') {
          startPolling(id);
        } else if (paymentData?.status === 'SUCCESS') {
          clearCart();
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load order';
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const startPolling = (orderId: number) => {
      // Clear any existing polling
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
      
      const poll = async () => {
        pollCountRef.current += 1;
        
        if (pollCountRef.current > MAX_POLL_ATTEMPTS || cancelled) {
          // Max attempts reached or unmounted, stop polling.
          // Payment remains PENDING — customer sees verification-timeout message.
          if (!cancelled) setPollTimedOut(true);
          return;
        }
        
        try {
          const paymentData = await getPaymentForOrder(orderId);
          if (cancelled) return;
          
          if (paymentData) {
            setPayment(paymentData);
            
            if (paymentData.status === 'SUCCESS') {
              // Backend confirmed payment success — refresh order and stop polling.
              const orderData = await getOrder(orderId);
              if (!cancelled) {
                setOrder(orderData);
                clearCart();
              }
              return;
            } else if (paymentData.status === 'FAILED') {
              // Payment failed, stop polling. Cart remains intact for retry.
              return;
            }
            // Still pending, continue polling
          }
        } catch (err) {
          console.error('Payment status polling error:', err);
        }
        
        // Continue polling
        if (!cancelled) {
          pollingRef.current = setTimeout(poll, POLL_INTERVAL);
        }
      };
      
      pollingRef.current = setTimeout(poll, POLL_INTERVAL);
    };

    fetchOrder();

    // Cleanup on unmount
    return () => {
      cancelled = true;
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
    };
  }, [params.id, user, refreshUser, clearCart]);

  // Retry a failed/pending Paystack payment for this order
  const handleRetryPayment = async () => {
    if (isRetryingRef.current || !order) return;

    isRetryingRef.current = true;
    setRetryingPayment(true);
    setError(null);

    try {
      const response = await initializePaystackPayment({
        order_id: order.id,
        callback_url: `${window.location.origin}/orders/${order.id}/confirmation`,
      });
      // Redirect to Paystack — cart is NOT cleared until backend confirms SUCCESS.
      window.location.href = response.authorization_url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start payment. Please try again.';
      setError(message);
      setRetryingPayment(false);
      isRetryingRef.current = false;
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="animate-pulse space-y-8">
          <Skeleton variant="rectangular" className="h-8 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton variant="rectangular" className="h-64" />
              <Skeleton variant="rectangular" className="h-48" />
            </div>
            <div className="space-y-4">
              <Skeleton variant="rectangular" className="h-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <svg className="mx-auto h-16 w-16 text-cream-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="mt-6 text-2xl font-bold text-gray-900">Order Not Found</h2>
        <p className="mt-3 text-cream-600 max-w-md mx-auto">{error || 'The order you are looking for does not exist or you do not have permission to view it.'}</p>
        <Link href="/shop" className="mt-8 inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Continue Shopping
        </Link>
      </div>
    );
  }

  const statusConfig = getStatusBadge(order.status);
  const paymentStatus = payment?.status ?? null;
  const isPaystackPayment = payment?.provider === 'paystack';
  const isPaymentPending = paymentStatus === 'PENDING' && isPaystackPayment;
  const isPaymentFailed = paymentStatus === 'FAILED';
  const hasAmountMismatch = !!(payment?.payment_metadata?.amount_mismatch);
  const hasCurrencyMismatch = !!(payment?.payment_metadata?.currency_mismatch);
  const isPaymentUnderReview = (hasAmountMismatch || hasCurrencyMismatch) && isPaystackPayment;

  // Determine heading/message from backend-confirmed state only.
  // CASH payments that are PENDING are normal (pay on delivery/pickup) and
  // should NOT display a "processing" state.
  let heading = 'Order Confirmed';
  let subheading = 'Thank you for your purchase!';
  if (isPaymentFailed) {
    heading = 'Payment Not Completed';
    subheading = 'Your payment was not completed. Your order has been saved and you can retry payment.';
  } else if (isPaymentUnderReview) {
    heading = 'Payment Under Review';
    subheading = 'Your payment is being reviewed due to an amount or currency discrepancy. This is a safety check and your order is on hold.';
  } else if (isPaymentPending && pollTimedOut) {
    heading = 'Verifying Your Payment';
    subheading = 'Your payment is still being verified. You can check your order status later.';
  } else if (isPaymentPending) {
    heading = 'Processing Your Payment';
    subheading = "We're confirming your payment...";
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{heading}</h1>
            <p className="mt-1 text-cream-600" aria-live="polite">{subheading}</p>
            {isPaymentPending && !pollTimedOut && (
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border border-blue-200">
                <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm text-blue-700">Confirming payment with your bank...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={statusConfig.variant} size="lg">
              {statusConfig.label}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <section className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
            <div className="p-6 border-b border-cream-200">
              <h2 className="text-xl font-bold text-gray-900">Order Items</h2>
              <p className="mt-1 text-cream-600">{order.order_items.length} item{order.order_items.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="divide-y divide-cream-200">
              {order.order_items.map(item => (
                <div key={item.id} className="p-6 flex gap-4">
                  <div className="relative w-20 h-20 flex-shrink-0 rounded-xl bg-cream-50 overflow-hidden">
                    <ProductImage
                      src={item.image_url}
                      alt={item.product_id ? `Product #${item.product_id}` : 'Product'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900">Product #{item.product_id}</h3>
                    <p className="text-sm text-cream-500">Qty: {item.quantity}</p>
                    <p className="text-sm font-medium text-green-600">{formatPrice(item.subtotal)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Order Info & Shipping */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white rounded-2xl border border-cream-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Information</h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-cream-600">Order Number</dt>
                  <dd className="font-medium text-gray-900 font-mono">#{order.id}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-cream-600">Order Date</dt>
                  <dd className="font-medium text-gray-900">{formatDate(order.created_at)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-cream-600">Fulfillment Method</dt>
                  <dd className="font-medium text-gray-900">{getFulfillmentLabel(order.fulfillment_method)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-cream-600">Order Status</dt>
                  <dd className="font-medium text-gray-900">
                    <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                  </dd>
                </div>
              </dl>
            </section>

            <section className="bg-white rounded-2xl border border-cream-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping Address</h2>
              {order.delivery_address_line ? (
                <address className="not-italic text-cream-600 space-y-1">
                  <p className="font-medium text-gray-900">{order.delivery_recipient_name}</p>
                  <p>{order.delivery_phone_number}</p>
                  <p>{order.delivery_address_line}</p>
                  <p>{order.delivery_city}, {order.delivery_state}</p>
                  {order.delivery_additional_directions && (
                    <p className="mt-2 text-sm">Note: {order.delivery_additional_directions}</p>
                  )}
                </address>
              ) : (
                <p className="text-cream-600">Store pickup - no delivery address</p>
              )}
            </section>
          </div>

          {/* Payment Info */}
          {payment && (
            <section className="bg-white rounded-2xl border border-cream-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Information</h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-cream-600">Payment Method</dt>
                  <dd className="font-medium text-gray-900 capitalize">{payment.payment_method.toLowerCase()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-cream-600">Payment Status</dt>
                  <dd className="font-medium text-gray-900">
                    <Badge variant={getPaymentStatusBadge(payment.status).variant}>{getPaymentStatusBadge(payment.status).label}</Badge>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-cream-600">Amount Paid</dt>
                  <dd className="font-bold text-green-600 text-lg">{formatPrice(payment.amount)}</dd>
                </div>
                {payment.provider_reference && (
                  <div className="flex justify-between">
                    <dt className="text-cream-600">Transaction Reference</dt>
                    <dd className="font-medium text-gray-900 font-mono text-sm break-all">{payment.provider_reference}</dd>
                  </div>
                )}
                {payment.paid_at && (
                  <div className="flex justify-between">
                    <dt className="text-cream-600">Paid At</dt>
                    <dd className="font-medium text-gray-900">{formatDate(payment.paid_at)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-cream-600">Payment Date</dt>
                  <dd className="font-medium text-gray-900">{formatDate(payment.created_at)}</dd>
                </div>
              </dl>

              {/* Retry payment for failed or timed-out-pending Paystack payments */}
              {((isPaymentFailed || (isPaymentPending && pollTimedOut)) && !isPaymentUnderReview) && payment.provider === 'paystack' && (
                <div className="mt-6 pt-4 border-t border-cream-200">
                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3" role="alert">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleRetryPayment}
                    disabled={retryingPayment}
                    loading={retryingPayment}
                  >
                    {retryingPayment ? 'Opening secure payment...' : 'Retry Payment'}
                  </Button>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <section className="sticky top-24 bg-white rounded-2xl border border-cream-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

            <dl className="space-y-3 mb-6">
              <div className="flex justify-between">
                <dt className="text-cream-600">Subtotal</dt>
                <dd className="font-medium text-gray-900">{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-cream-600">Delivery Fee</dt>
                <dd className="font-medium text-gray-900">{formatPrice(order.delivery_fee)}</dd>
              </div>
              <div className="flex justify-between pt-3 border-t border-cream-200">
                <dt className="text-lg font-semibold text-gray-900">Total</dt>
                <dd className="text-lg font-bold text-green-600">{formatPrice(order.total_amount)}</dd>
              </div>
            </dl>

            <div className="space-y-3">
              <Link href={`/orders/${order.id}`}>
                <Button variant="outline" size="lg" className="w-full">
                  View Order
                </Button>
              </Link>
              <Link href="/orders">
                <Button variant="outline" size="lg" className="w-full">
                  View My Orders
                </Button>
              </Link>
              <Link href="/shop">
                <Button variant="primary" size="lg" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </div>

            <p className="mt-6 text-center text-xs text-cream-500">
              Need help? <Link href="/contact" className="text-green-600 hover:underline">Contact Support</Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}