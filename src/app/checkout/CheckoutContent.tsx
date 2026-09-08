'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { validateCheckout, createCheckout, createPayment, getAddresses, createAddress, updateAddress, initializePaystackPayment } from '@/lib/api';
import { ProductImage } from '@/components/ui/ProductImage';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Address, CheckoutValidationResponse, CheckoutRequest } from '@/types/api';

const formatPrice = (price: number | string) => {
  return Number(price).toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

interface CheckoutContentProps {
  initialAddresses: Address[];
}

// Helper to find initial selected address
function getInitialSelectedAddressId(addresses: Address[]): number | null {
  if (addresses.length === 0) return null;
  const defaultAddr = addresses.find(a => a.is_default);
  return defaultAddr ? defaultAddr.id : addresses[0].id;
}

export function CheckoutContent({ initialAddresses }: CheckoutContentProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { items, subtotal, totalItems, clearCart } = useCart();
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(() => getInitialSelectedAddressId(initialAddresses));
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'STORE_DELIVERY' | 'CUSTOMER_DISPATCH' | 'STORE_PICKUP'>('STORE_PICKUP');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  
  const [validation, setValidation] = useState<CheckoutValidationResponse | null>(null);
  const [validating, setValidating] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Guard against duplicate order submissions
  const isProcessingOrderRef = useRef(false);

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'PAYSTACK'>('CASH');

  // Address form state
  const [addressForm, setAddressForm] = useState({
    recipient_name: '',
    phone_number: '',
    address_line: '',
    city: '',
    state: '',
    additional_directions: '',
    is_default: false,
  });

  // Sync addresses from server after auth â€“ ensures address management changes are reflected at checkout
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getAddresses()
      .then(data => {
        if (cancelled) return;
        setAddresses(data);
        // If no selection yet, pick default or first
        setSelectedAddressId(prev => {
          if (prev !== null && data.some(a => a.id === prev)) return prev;
          return getInitialSelectedAddressId(data);
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Build checkout request from cart
  const buildCheckoutRequest = useCallback((): CheckoutRequest => {
    return {
      items: items.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
      })),
      fulfillment_method: fulfillmentMethod,
      address_id: fulfillmentMethod === 'STORE_PICKUP' ? null : selectedAddressId,
    };
  }, [items, fulfillmentMethod, selectedAddressId]);

  // Handle address form submit
  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, addressForm);
      } else {
        await createAddress(addressForm);
      }
      setShowAddressForm(false);
      setEditingAddress(null);
      setAddressForm({
        recipient_name: '',
        phone_number: '',
        address_line: '',
        city: '',
        state: '',
        additional_directions: '',
        is_default: false,
      });
      // Reload addresses after creating/updating
      const data = await getAddresses();
      setAddresses(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save address';
      setError(message);
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({
      recipient_name: address.recipient_name,
      phone_number: address.phone_number,
      address_line: address.address_line,
      city: address.city,
      state: address.state,
      additional_directions: address.additional_directions || '',
      is_default: address.is_default,
    });
    setShowAddressForm(true);
  };

  const handleNewAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      recipient_name: '',
      phone_number: '',
      address_line: '',
      city: '',
      state: '',
      additional_directions: '',
      is_default: false,
    });
    setShowAddressForm(true);
  };

  // Validate checkout - returns result for immediate use to avoid stale closure
  const handleValidate = useCallback(async (): Promise<CheckoutValidationResponse | null> => {
    if (items.length === 0) {
      setError('Your cart is empty');
      return null;
    }

    if (fulfillmentMethod !== 'STORE_PICKUP' && !selectedAddressId) {
      setError('Please select a delivery address');
      return null;
    }

    setValidating(true);
    setError(null);
    setValidation(null);

    try {
      const request = buildCheckoutRequest();
      const result = await validateCheckout(request);
      setValidation(result);
      
      if (!result.valid) {
        setError(result.errors?.join(', ') || 'Checkout validation failed');
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Validation failed';
      setError(message);
      return null;
    } finally {
      setValidating(false);
    }
  }, [items, fulfillmentMethod, selectedAddressId, buildCheckoutRequest]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/checkout');
    }
  }, [user, authLoading, router]);

  // Redirect if cart empty
  useEffect(() => {
    if (!authLoading && user && items.length === 0) {
      router.push('/cart');
    }
  }, [items, user, authLoading, router]);

  // Auto-validate on mount and when cart/address changes
  useEffect(() => {
    if (user && items.length > 0) {
      const timer = setTimeout(handleValidate, 300);
      return () => clearTimeout(timer);
    }
  }, [items, selectedAddressId, fulfillmentMethod, user, handleValidate]);

  // Create order - revalidates fresh to ensure backend-authoritative data
  const handlePlaceOrder = async () => {
    if (isProcessingOrderRef.current) return;
    isProcessingOrderRef.current = true;
    setCreatingOrder(true);
    setError(null);
    let freshValidation: CheckoutValidationResponse | null = null;
    try {
      freshValidation = await handleValidate();
      if (!freshValidation?.valid) {
        return;
      }
    } catch {
      return;
    } finally {
      if (!freshValidation?.valid) {
        setCreatingOrder(false);
        isProcessingOrderRef.current = false;
      }
    }
    if (!freshValidation?.valid) return;
    try {
      const request = buildCheckoutRequest();
      const order = await createCheckout(request);
      
      if (paymentMethod === 'PAYSTACK') {
        // Initialize Paystack payment
        const paystackResponse = await initializePaystackPayment({
          order_id: order.id,
          callback_url: `${window.location.origin}/orders/${order.id}/confirmation`,
        });
        
        // Redirect to Paystack authorization URL
        window.location.href = paystackResponse.authorization_url;
        return;
      }
      
      // CASH payment flow
      // Do NOT clear cart here â€” CASH requires staff confirmation.
      // Cart will be managed by the order confirmation page after staff verifies payment.
      await createPayment({
        order_id: order.id,
        payment_method: 'CASH',
      });
      
      // Navigate to confirmation
      router.push(`/orders/${order.id}/confirmation`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Order creation failed';
      setError(message);
    } finally {
      setCreatingOrder(false);
      isProcessingOrderRef.current = false;
    }
  };

  if (authLoading || (user && !validation && items.length > 0 && !validating)) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse flex flex-col items-center gap-4 text-cream-500">
            <Skeleton variant="rectangular" className="h-8 w-48" />
            <Skeleton variant="rectangular" className="h-4 w-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!user || items.length === 0) {
    return null; // Handled by redirects
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Checkout</h1>
        <p className="mt-1 text-cream-600">Review your order and complete your purchase</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4" role="alert">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address */}
          <section className="bg-white rounded-2xl border border-cream-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Shipping Address</h2>
              {fulfillmentMethod !== 'STORE_PICKUP' && (
                <Button variant="outline" size="sm" onClick={handleNewAddress}>
                  Add New Address
                </Button>
              )}
            </div>

            {fulfillmentMethod === 'STORE_PICKUP' ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-cream-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <p className="mt-3 text-cream-600">Store pickup selected - no delivery address needed</p>
              </div>
            ) : (
              <>
                {addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-cream-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="mt-3 text-cream-600">No saved addresses found</p>
                    <Button className="mt-4" onClick={handleNewAddress}>
                      Add Your First Address
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3" role="radiogroup" aria-label="Select delivery address">
                    {addresses.map(address => (
                      <div
                        key={address.id}
                        role="radio"
                        aria-checked={selectedAddressId === address.id}
                        tabIndex={0}
                        onClick={() => setSelectedAddressId(address.id)}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            setSelectedAddressId(address.id);
                          }
                        }}
                        className={`relative cursor-pointer p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          selectedAddressId === address.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-cream-200 hover:border-green-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shipping-address"
                          value={address.id}
                          checked={selectedAddressId === address.id}
                          onChange={() => setSelectedAddressId(address.id)}
                          className="sr-only"
                          tabIndex={-1}
                          aria-hidden="true"
                        />
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{address.recipient_name}</span>
                              {address.is_default && (
                                <Badge variant="success" size="sm">Default</Badge>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-cream-600">{address.address_line}</p>
                            <p className="text-sm text-cream-600">{address.city}, {address.state}</p>
                            <p className="text-sm text-cream-600">{address.phone_number}</p>
                            {address.additional_directions && (
                              <p className="mt-1 text-sm text-cream-500">{address.additional_directions}</p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEditAddress(address); }}>
                              Edit
                            </Button>
                          </div>
                        </div>
                        {selectedAddressId === address.id && (
                          <div className="absolute inset-0 border-2 border-green-500 rounded-xl pointer-events-none" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Fulfillment Method */}
            <div className="mt-6 pt-6 border-t border-cream-200">
              <h3 className="font-medium text-gray-900 mb-3">Delivery Method</h3>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { value: 'STORE_PICKUP', label: 'Store Pickup', desc: 'Collect from our store' },
                  { value: 'STORE_DELIVERY', label: 'Store Delivery', desc: 'We deliver to you' },
                  { value: 'CUSTOMER_DISPATCH', label: 'Customer Dispatch', desc: 'Courier service' },
                ]).map(method => (
                  <label
                    key={method.value}
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      fulfillmentMethod === method.value
                        ? 'border-green-500 bg-green-50'
                        : 'border-cream-200 hover:border-green-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="fulfillment"
                      value={method.value}
                      checked={fulfillmentMethod === method.value}
                      onChange={() => setFulfillmentMethod(method.value as typeof fulfillmentMethod)}
                      className="sr-only"
                    />
                    <div className="font-medium text-gray-900">{method.label}</div>
                    <div className="text-sm text-cream-600 mt-1">{method.desc}</div>
                    {fulfillmentMethod === method.value && (
                      <div className="absolute inset-0 border-2 border-green-500 rounded-xl pointer-events-none" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          </section>

          {/* Address Form Modal */}
          {(showAddressForm || editingAddress) && (
            <section className="bg-white rounded-2xl border border-cream-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{editingAddress ? 'Edit Address' : 'New Address'}</h2>
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="checkout-recipient-name" className="block text-sm font-medium text-gray-700 mb-1">Recipient Name *</label>
                    <input
                      id="checkout-recipient-name"
                      type="text"
                      value={addressForm.recipient_name}
                      onChange={e => setAddressForm({...addressForm, recipient_name: e.target.value})}
                      required
                      autoComplete="name"
                      className="w-full px-4 py-2.5 border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="checkout-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input
                      id="checkout-phone"
                      type="tel"
                      value={addressForm.phone_number}
                      onChange={e => setAddressForm({...addressForm, phone_number: e.target.value})}
                      required
                      autoComplete="tel"
                      className="w-full px-4 py-2.5 border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="checkout-address-line" className="block text-sm font-medium text-gray-700 mb-1">Address Line *</label>
                  <input
                    id="checkout-address-line"
                    type="text"
                    value={addressForm.address_line}
                    onChange={e => setAddressForm({...addressForm, address_line: e.target.value})}
                    required
                    autoComplete="street-address"
                    className="w-full px-4 py-2.5 border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="checkout-city" className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      id="checkout-city"
                      type="text"
                      value={addressForm.city}
                      onChange={e => setAddressForm({...addressForm, city: e.target.value})}
                      required
                      autoComplete="address-level2"
                      className="w-full px-4 py-2.5 border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="checkout-state" className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <input
                      id="checkout-state"
                      type="text"
                      value={addressForm.state}
                      onChange={e => setAddressForm({...addressForm, state: e.target.value})}
                      required
                      autoComplete="address-level1"
                      className="w-full px-4 py-2.5 border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="checkout-directions" className="block text-sm font-medium text-gray-700 mb-1">Additional Directions</label>
                  <textarea
                    id="checkout-directions"
                    value={addressForm.additional_directions}
                    onChange={e => setAddressForm({...addressForm, additional_directions: e.target.value})}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={addressForm.is_default}
                    onChange={e => setAddressForm({...addressForm, is_default: e.target.checked})}
                    className="h-4 w-4 text-green-600 border-cream-200 rounded focus:ring-green-500"
                  />
                  <label htmlFor="is_default" className="text-sm text-gray-700">Set as default address</label>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1" disabled={validating || creatingOrder}>
                    {editingAddress ? 'Update Address' : 'Save Address'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setShowAddressForm(false); setEditingAddress(null); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </section>
          )}

          {/* Payment Method */}
          <section className="bg-white rounded-2xl border border-cream-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>
            <div className="space-y-3">
              {(['CASH', 'PAYSTACK', 'CARD', 'TRANSFER'] as const).map(method => {
                const isAvailable = method === 'CASH' || method === 'PAYSTACK';
                return (
                  <label
                    key={method}
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isAvailable
                        ? 'border-cream-200 hover:border-green-300'
                        : 'border-cream-200 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={() => setPaymentMethod(method as 'CASH' | 'PAYSTACK')}
                      className="sr-only"
                      disabled={!isAvailable}
                    />
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-cream-100 flex items-center justify-center">
                        {method === 'CASH' && (
                          <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {method === 'PAYSTACK' && (
                          <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8zm-1.25-6.75c-.63 0-1.14.52-1.22 1.15h-2.06c.06-.91.65-1.65 1.56-1.65.62 0 1.12.5 1.15 1.12.04.7-.52 1.25-1.2 1.25-.48 0-.89-.37-1-1H9c-.83 0-1.5.68-1.5 1.5S8.17 12 9 12c.87 0 1.56-.58 1.77-1.33l2.72 2.7c-.83.6-1.9.94-3 .47-1.1-.48-1.7-1.52-1.7-2.66 0-.76.5-1.41 1.23-1.65C9.24 10.44 8.01 9 6.48 9c-2.76 0-5 2.24-5 5s2.24 5 5 5c2.2 0 3.93-1.35 4.54-3.19.21.56.63.98 1.2.98h.02c.94 0 1.72-.94 1.72-2.1s-.77-2.09-1.73-2.16z"/>
                          </svg>
                        )}
                        {method === 'CARD' && (
                          <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        )}
                        {method === 'TRANSFER' && (
                          <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 capitalize">{method.toLowerCase()}</div>
                        <div className="text-sm text-cream-600">
                          {method === 'CASH' ? 'Pay on delivery/pickup' : method === 'PAYSTACK' ? 'Pay with card, transfer, or USSD' : method === 'CARD' ? 'Card payment (coming soon)' : 'Bank transfer (coming soon)'}
                        </div>
                      </div>
                    </div>
                    {isAvailable && (
                      <div
                        className={`absolute inset-0 border-2 rounded-xl pointer-events-none ${
                          paymentMethod === method ? 'border-green-500' : 'border-transparent'
                        }`}
                      />
                    )}
                  </label>
                )
              })}
              <p className="mt-4 text-sm text-cream-500">Currently only cash on delivery/pickup and Paystack online payments are supported. Card and transfer options coming soon.</p>
            </div>
          </section>

          {/* Place Order Button */}
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handlePlaceOrder}
            disabled={creatingOrder || !validation?.valid || validating}
            loading={creatingOrder}
          >
            {creatingOrder
              ? paymentMethod === 'PAYSTACK'
                ? 'Preparing secure payment...'
                : 'Creating Order...'
              : paymentMethod === 'PAYSTACK'
              ? 'Proceed to Secure Payment'
              : 'Place Order'}
          </Button>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white rounded-2xl border border-cream-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
              {items.map(item => (
                <div key={item.productId} className="flex gap-3">
                  <div className="relative w-16 h-16 flex-shrink-0 rounded-xl bg-cream-50 overflow-hidden">
                    <ProductImage
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.productId}`}
                      className="font-medium text-gray-900 hover:text-green-600 line-clamp-1 block"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-cream-500">Qty: {item.quantity}</p>
                    <p className="text-sm font-medium text-green-600">{formatPrice(Number(item.unitPrice) * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>

            <dl className="space-y-3 mb-6 border-t border-cream-200 pt-4">
              <div className="flex justify-between text-sm">
                <dt className="text-cream-600">Subtotal ({totalItems} item{totalItems !== 1 ? 's' : ''})</dt>
                <dd className="font-medium text-gray-900">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-cream-600">Delivery Fee</dt>
                <dd className="font-medium text-gray-900">
                  {validation?.summary ? formatPrice(validation.summary.delivery_fee) : 
                   fulfillmentMethod === 'STORE_PICKUP' ? 'Free' : 'Calculated at checkout'}
                </dd>
              </div>
              {validation?.summary?.delivery_address && (
                <div className="flex justify-between text-sm">
                  <dt className="text-cream-600">Delivery To</dt>
                  <dd className="font-medium text-gray-900 text-right max-w-[150px] truncate">
                    {validation.summary.delivery_address.city}, {validation.summary.delivery_address.state}
                  </dd>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-cream-200">
                <dt className="text-lg font-semibold text-gray-900">Total</dt>
                <dd className="text-lg font-bold text-green-600">
                  {validation?.summary ? formatPrice(validation.summary.total_amount) : formatPrice(subtotal)}
                </dd>
              </div>
            </dl>

            <p className="text-xs text-cream-500 text-center">
              Delivery fee will be finalized based on your location and delivery method.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
