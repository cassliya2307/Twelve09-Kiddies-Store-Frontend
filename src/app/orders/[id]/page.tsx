/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProductImage } from '@/components/ui/ProductImage';
import { getOrder, getPaymentForOrder, getProduct, cancelOrder } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/format';
import { getOrderStatusView, getPaymentStatusView, getFulfillmentLabel } from '@/lib/statusLabels';
import { OrderTimeline } from '@/components/orders/OrderTimeline';
import type { Order, Payment, Product } from '@/types/api';

function canCancelOrder(status: string | null | undefined, fulfillmentMethod: string | null | undefined): boolean {
  if (!status) return false;
  if (status === 'COMPLETED' || status === 'CANCELLED') return false;
  if (status === 'PENDING' || status === 'CONFIRMED' || status === 'PROCESSING') return true;
  if (status === 'READY_FOR_PICKUP') return fulfillmentMethod === 'STORE_PICKUP';
  if (status === 'OUT_FOR_DELIVERY') return fulfillmentMethod === 'STORE_DELIVERY' || fulfillmentMethod === 'CUSTOMER_DISPATCH';
  return false;
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { addToCart, getCartQuantity } = useCart();

  const orderId = Number(params.id);

  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [productNames, setProductNames] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  // Cancel state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);

  // Reorder state
  const [reordering, setReordering] = useState(false);
  const [reorderMessage, setReorderMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?redirect=/orders/${orderId}`);
    }
  }, [authLoading, isAuthenticated, router, orderId]);

  const fetchOrder = async (signal?: { cancelled: boolean }) => {
    if (Number.isNaN(orderId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    try {
      const [orderData, paymentData] = await Promise.all([
        getOrder(orderId),
        getPaymentForOrder(orderId).catch(() => null),
      ]);
      if (signal?.cancelled) return;
      setOrder(orderData);
      setPayment(paymentData);

      const names: Record<number, string> = {};
      await Promise.all(
        (orderData.order_items ?? []).map(async (item) => {
          try {
            const product = await getProduct(item.product_id);
            names[item.product_id] = product.name;
          } catch {
            names[item.product_id] = `Product #${item.product_id}`;
          }
        })
      );
      if (signal?.cancelled) return;
      setProductNames(names);
      setNotFound(false);
      setError(null);
    } catch (err) {
      if (signal?.cancelled) return;
      const message = err instanceof Error ? err.message : 'Failed to load order';
      if (/404|403/.test(message)) {
        setNotFound(true);
      } else {
        setError(message);
      }
    } finally {
      if (!signal?.cancelled) setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setLoading(true);
    const signal = { cancelled: false };
    // wrap to track cancellation via closure
    const run = async () => {
      await fetchOrder(signal);
      if (cancelled) return;
    };
    run();
    return () => {
      cancelled = true;
      signal.cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, orderId, retryNonce]);

  // Cancel handler
  const handleCancelConfirm = async () => {
    if (!order || cancelling) return;
    setCancelling(true);
    setCancelError(null);
    try {
      const updated = await cancelOrder(order.id);
      setOrder(updated);
      // refresh payment/state is unchanged, but refetch order to ensure timeline accuracy
      setCancelSuccess('Order cancelled successfully.');
      setShowCancelDialog(false);
      // refetch full order to get latest (in case backend returns stale)
      try {
        const fresh = await getOrder(order.id);
        setOrder(fresh);
      } catch {
        // keep updated from cancel response
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel order';
      if (/401/.test(message)) {
        setCancelError('Please sign in again to cancel this order.');
      } else if (/403/.test(message)) {
        setCancelError('You do not have permission to cancel this order.');
      } else if (/404/.test(message)) {
        setCancelError('Order not found. It may have been removed.');
        setNotFound(true);
      } else if (/Invalid status transition/.test(message) || /can no longer be cancelled/.test(message) || /400/.test(message)) {
        setCancelError('This order can no longer be cancelled because its status has changed.');
        // refresh order to show new status
        try {
          const fresh = await getOrder(order.id);
          setOrder(fresh);
        } catch {}
      } else {
        setCancelError(message);
      }
    } finally {
      setCancelling(false);
    }
  };

  // Reorder handler
  const handleReorder = async () => {
    if (!order || reordering) return;
    setReordering(true);
    setReorderMessage(null);
    setCancelError(null);

    const items = order.order_items ?? [];
    if (items.length === 0) {
      setReorderMessage({ type: 'error', text: "This order has no items to reorder." });
      setReordering(false);
      return;
    }

    try {
      // Collect unique product IDs
      const uniqueProductIds = [...new Set(items.map((item) => item.product_id))];
      // Fetch all products in parallel
      const products = await Promise.all(
        uniqueProductIds.map((id) => getProduct(id).catch(() => null))
      );
      const productMap = new Map(products.filter((p): p is Product => p !== null).map((p) => [p.id, p]));

      let addedCount = 0;
      let partialCount = 0;
      let skippedOutOfStock = 0;
      let skippedInactive = 0;
      let skippedNotFound = 0;

      for (const item of items) {
        const product = productMap.get(item.product_id);
        if (!product) {
          skippedNotFound++;
          continue;
        }
        if (!product.is_active) {
          skippedInactive++;
          continue;
        }
        if (product.stock_quantity <= 0) {
          skippedOutOfStock++;
          continue;
        }
        // Account for existing quantity in cart
        const existingQty = getCartQuantity(product.id);
        const availableStock = Math.max(0, product.stock_quantity - existingQty);
        if (availableStock <= 0) {
          skippedOutOfStock++;
          continue;
        }
        const qtyToAdd = Math.min(item.quantity, availableStock);
        if (qtyToAdd < item.quantity) partialCount++;
        if (qtyToAdd <= 0) {
          skippedOutOfStock++;
          continue;
        }
        addToCart(product, qtyToAdd);
        addedCount++;
      }

      if (addedCount > 0) {
        let text = `${addedCount} item${addedCount !== 1 ? 's' : ''} added to your cart. Current prices and stock were applied.`;
        if (partialCount > 0) text += ` ${partialCount} item(s) added with reduced quantity due to limited stock.`;
        if (skippedOutOfStock > 0) text += ` ${skippedOutOfStock} item(s) couldn't be added because they are out of stock.`;
        if (skippedInactive > 0) text += ` ${skippedInactive} item(s) couldn't be added because they are no longer available.`;
        if (skippedNotFound > 0) text += ` ${skippedNotFound} item(s) could not be retrieved.`;
        setReorderMessage({ type: 'success', text });
        router.push('/cart');
      } else {
        let text = "This order can't be reordered right now because its items are no longer available.";
        if (skippedOutOfStock > 0) text = "No items could be added — some items are out of stock. " + text;
        if (skippedInactive > 0) text = "No items could be added — items are no longer available. " + text;
        setReorderMessage({ type: 'error', text });
      }
    } catch {
      setReorderMessage({ type: 'error', text: "Failed to process reorder. Please try again." });
    }
    setReordering(false);
  };

  if (authLoading || (!isAuthenticated && !notFound && !error)) {
    return (
      <>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
          <Skeleton variant="text" width="40%" height="32px" className="mb-6" />
          <div className="bg-white rounded-2xl border border-cream-200 p-6 space-y-4">
            <Skeleton variant="text" width="50%" />
            <Skeleton variant="rectangular" className="aspect-video" />
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
        <MobileBottomNav />
      </>
    );
  }

  const isCancellable = order ? canCancelOrder(order.status, order.fulfillment_method) : false;

  return (
    <>
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        <nav className="mb-4" aria-label="Breadcrumb">
          <Link href="/orders" className="text-sm text-green-600 hover:text-green-700">
            &larr; Back to My Orders
          </Link>
        </nav>

        {notFound && (
          <div className="bg-white rounded-2xl border border-cream-200 py-16 px-6 text-center">
            <svg
              className="mx-auto h-16 w-16 text-cream-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h1 className="mt-6 text-xl font-bold text-gray-900">Order not found</h1>
            <p className="mt-2 text-cream-600">
              We couldn&apos;t find this order. It may belong to another account or no longer exists.
            </p>
            <Link href="/orders" className="mt-6 inline-block">
              <Button variant="primary" size="lg">
                View My Orders
              </Button>
            </Link>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4" role="alert">
            <p className="text-sm text-red-700">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setRetryNonce((n) => n + 1)}>
              Try Again
            </Button>
          </div>
        )}

        {loading && !error && !notFound && (
          <div className="bg-white rounded-2xl border border-cream-200 p-6 space-y-4" aria-live="polite">
            <Skeleton variant="text" width="50%" />
            <Skeleton variant="rectangular" className="aspect-video" />
            <Skeleton variant="text" width="40%" />
          </div>
        )}

        {!loading && !error && !notFound && order && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Order #{order.id}</h1>
                <p className="mt-1 text-cream-600">{formatDate(order.created_at)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={getOrderStatusView(order.status).variant} size="lg">
                  {getOrderStatusView(order.status).label}
                </Badge>
                {payment && (
                  <Badge variant={getPaymentStatusView(payment.status).variant} size="lg">
                    {getPaymentStatusView(payment.status).label}
                  </Badge>
                )}
              </div>
            </div>

            {/* Feedback banners */}
            <div aria-live="polite" className="space-y-3">
              {cancelSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4" role="status">
                  <p className="text-sm font-medium text-green-800">{cancelSuccess}</p>
                </div>
              )}
              {cancelError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4" role="alert">
                  <p className="text-sm text-red-700">{cancelError}</p>
                </div>
              )}
              {reorderMessage && (
                <div
                  className={`rounded-xl p-4 border ${
                    reorderMessage.type === 'success'
                      ? 'bg-green-50 border-green-200'
                      : reorderMessage.type === 'error'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}
                  role={reorderMessage.type === 'error' ? 'alert' : 'status'}
                >
                  <p
                    className={`text-sm ${
                      reorderMessage.type === 'success'
                        ? 'text-green-800'
                        : reorderMessage.type === 'error'
                        ? 'text-red-700'
                        : 'text-amber-800'
                    }`}
                  >
                    {reorderMessage.text}
                  </p>
                </div>
              )}
            </div>

            {/* Action bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={handleReorder}
                loading={reordering}
                disabled={reordering || cancelling}
                className="flex-1 sm:flex-none"
                aria-label="Reorder items from this order"
              >
                Reorder
              </Button>
              {isCancellable && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setCancelError(null);
                    setCancelSuccess(null);
                    setShowCancelDialog(true);
                  }}
                  disabled={cancelling || reordering}
                  className="flex-1 sm:flex-none border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 focus:ring-red-500"
                  aria-label="Cancel this order"
                >
                  Cancel Order
                </Button>
              )}
            </div>

            {/* Cancel confirmation dialog */}
            {showCancelDialog && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="cancel-dialog-title"
                aria-describedby="cancel-dialog-desc"
              >
                <div
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                  onClick={() => !cancelling && setShowCancelDialog(false)}
                  aria-hidden="true"
                />
                <div className="relative bg-white rounded-2xl border border-cream-200 p-6 w-full max-w-md shadow-xl">
                  <h2 id="cancel-dialog-title" className="text-xl font-bold text-gray-900">
                    Cancel this order?
                  </h2>
                  <p id="cancel-dialog-desc" className="mt-2 text-sm text-cream-600">
                    Are you sure you want to cancel order #{order.id}? This action cannot be undone through the normal customer interface. Payment status will not be changed automatically and stock handling follows backend rules.
                  </p>
                  {cancelError && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3" role="alert">
                      <p className="text-sm text-red-700">{cancelError}</p>
                    </div>
                  )}
                  <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowCancelDialog(false)}
                      disabled={cancelling}
                      autoFocus
                    >
                      Keep Order
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-500 border-red-600"
                      onClick={handleCancelConfirm}
                      loading={cancelling}
                      disabled={cancelling}
                    >
                      Cancel Order
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <OrderTimeline order={order} />

            {/* Order Information */}
            <section className="bg-white rounded-2xl border border-cream-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Information</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-cream-500">Order Number</dt>
                  <dd className="font-medium text-gray-900 font-mono">#{order.id}</dd>
                </div>
                <div>
                  <dt className="text-sm text-cream-500">Order Date</dt>
                  <dd className="font-medium text-gray-900">{formatDate(order.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-cream-500">Order Status</dt>
                  <dd>
                    <Badge variant={getOrderStatusView(order.status).variant}>
                      {getOrderStatusView(order.status).label}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-cream-500">Fulfillment Method</dt>
                  <dd className="font-medium text-gray-900">{getFulfillmentLabel(order.fulfillment_method)}</dd>
                </div>
              </dl>
            </section>

            {/* Items */}
            <section className="bg-white rounded-2xl border border-cream-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Items</h2>
              <ul className="divide-y divide-cream-200">
                {(order.order_items ?? []).map((item) => (
                  <li key={item.id} className="py-4 flex gap-4">
                    <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-cream-100">
                      <ProductImage
                        src={item.image_url}
                        alt={productNames[item.product_id] ?? `Product #${item.product_id}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">
                        {productNames[item.product_id] ?? `Product #${item.product_id}`}
                      </h3>
                      <p className="text-sm text-cream-500">Qty: {item.quantity}</p>
                      <p className="mt-1 text-sm font-medium text-green-600">
                        {formatPrice(Number(item.unit_price) * item.quantity)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-cream-500">{formatPrice(item.unit_price)} each</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Totals */}
            <section className="bg-white rounded-2xl border border-cream-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Totals</h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-cream-600">Subtotal</dt>
                  <dd className="font-medium text-gray-900">{formatPrice(order.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-cream-600">Delivery Fee</dt>
                  <dd className="font-medium text-gray-900">
                    {order.fulfillment_method === 'STORE_PICKUP' && Number(order.delivery_fee) === 0
                      ? 'Free'
                      : formatPrice(order.delivery_fee)}
                  </dd>
                </div>
                <div className="flex justify-between pt-3 border-t border-cream-200">
                  <dt className="text-lg font-semibold text-gray-900">Total</dt>
                  <dd className="text-lg font-bold text-green-600">{formatPrice(order.total_amount)}</dd>
                </div>
              </dl>
            </section>

            {/* Delivery / Shipping */}
            {order.delivery_address_line && (
              <section className="bg-white rounded-2xl border border-cream-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Information</h2>
                <address className="not-italic text-cream-600 space-y-1">
                  <p className="font-medium text-gray-900">{order.delivery_recipient_name}</p>
                  <p>{order.delivery_phone_number}</p>
                  <p>{order.delivery_address_line}</p>
                  <p>
                    {order.delivery_city}
                    {order.delivery_state ? `, ${order.delivery_state}` : ''}
                  </p>
                  {order.delivery_additional_directions && (
                    <p className="mt-2 text-sm">Note: {order.delivery_additional_directions}</p>
                  )}
                </address>
              </section>
            )}

            {/* Payment */}
            <section className="bg-white rounded-2xl border border-cream-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Payment</h2>
              {payment ? (
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-cream-600">Payment Method</dt>
                    <dd className="font-medium text-gray-900 capitalize">
                      {payment.payment_method.toLowerCase()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-cream-600">Status</dt>
                    <dd>
                      <Badge variant={getPaymentStatusView(payment.status).variant}>
                        {getPaymentStatusView(payment.status).label}
                      </Badge>
                    </dd>
                  </div>
                  {payment.provider && (
                    <div className="flex justify-between">
                      <dt className="text-cream-600">Provider</dt>
                      <dd className="font-medium text-gray-900 capitalize">{payment.provider}</dd>
                    </div>
                  )}
                  {payment.provider_reference && (
                    <div className="flex justify-between">
                      <dt className="text-cream-600">Transaction Reference</dt>
                      <dd className="font-medium text-gray-900 font-mono text-sm break-all">
                        {payment.provider_reference}
                      </dd>
                    </div>
                  )}
                  {payment.paid_at && (
                    <div className="flex justify-between">
                      <dt className="text-cream-600">Paid At</dt>
                      <dd className="font-medium text-gray-900">{formatDate(payment.paid_at)}</dd>
                    </div>
                  )}
                </dl>
              ) : (
                <p className="text-cream-600">No payment record is associated with this order yet.</p>
              )}
            </section>

            <div className="flex flex-wrap gap-3">
              <Link href="/orders">
                <Button variant="outline" size="lg">
                  View My Orders
                </Button>
              </Link>
              <Link href="/shop">
                <Button variant="primary" size="lg">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
      <MobileBottomNav />
    </>
  );
}
