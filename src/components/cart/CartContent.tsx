'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { ProductImage } from '@/components/ui/ProductImage';
import { Button } from '@/components/ui/Button';
import { ProductQuantitySelector } from '@/components/product/ProductQuantitySelector';
import type { Category } from '@/types/api';

interface CartContentProps {
  categories: Category[];
}

export function CartContent({ categories }: CartContentProps) {
  const { items, subtotal, totalItems, removeFromCart, updateQuantity, clearCart, isInitialized, lastRefreshed } = useCart();

  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  const formatPrice = (price: string) => {
    return Number(price).toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const formatLastRefreshed = (timestamp: number | null) => {
    if (!timestamp) return 'not yet verified';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  };

  const formatSubtotal = (unitPrice: string, quantity: number) => {
    return Number(unitPrice) * quantity;
  };

  if (!isInitialized) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse flex flex-col items-center gap-4 text-cream-500">
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p className="text-lg">Loading cart...</p>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center py-16">
          <svg className="mx-auto h-16 w-16 text-cream-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Your cart is empty</h2>
          <p className="mt-2 text-cream-600 max-w-md mx-auto">
            Looks like you haven&apos;t added any products yet. Start shopping to fill your cart!
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" role="table">
                <thead>
                  <tr className="bg-cream-50 border-b border-cream-200">
                    <th className="px-4 py-3 text-left text-sm font-medium text-cream-600">Product</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-cream-600">Price</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-cream-600">Quantity</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-cream-600">Subtotal</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-cream-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-200">
                  {items.map((item) => {
                    const category = item.product.category_id
                      ? categories.find((c) => c.id === item.product.category_id)
                      : null;
                    const itemSubtotal = formatSubtotal(item.unitPrice, item.quantity);

                    return (
                      <tr key={item.productId} className="hover:bg-cream-50/50">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-4">
                            <div className="relative w-20 h-20 flex-shrink-0 rounded-xl bg-cream-50 overflow-hidden">
                              <ProductImage
                                src={item.product.image_url}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/products/${item.productId}`}
                                className="font-medium text-gray-900 hover:text-green-600 transition-colors line-clamp-1 block"
                              >
                                {item.product.name}
                              </Link>
                              {category && (
                                <span className="text-sm text-cream-500">{category.name}</span>
                              )}
                              <p className="text-sm font-medium text-green-600 mt-1">{formatPrice(item.unitPrice)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="font-medium text-gray-900">{formatPrice(item.unitPrice)}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <ProductQuantitySelector
                            maxQuantity={item.product.stock_quantity}
                            initialQuantity={item.quantity}
                            onQuantityChange={(qty) => updateQuantity(item.productId, qty)}
                            disabled={item.product.stock_quantity <= 0 || !item.product.is_active}
                          />
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="font-bold text-gray-900 text-lg">{formatPrice(itemSubtotal.toString())}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="text-red-600 hover:text-red-700 font-medium text-sm transition-colors"
                            aria-label={`Remove ${item.product.name} from cart`}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {items.some((item) => item.quantity > item.product.stock_quantity || !item.product.is_active) && (
              <div className="p-4 bg-amber-50 border-t border-cream-200">
                <p className="text-sm text-amber-800" role="alert">
                  Some items have been adjusted due to stock changes or availability.
                </p>
              </div>
            )}

            <div className="p-4 border-t border-cream-200 flex justify-end">
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 font-medium text-sm transition-colors"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white rounded-2xl border border-cream-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

            {lastRefreshed && (
              <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded-xl text-center">
                <p className="text-xs text-green-700">
                  Prices verified at {formatLastRefreshed(lastRefreshed)}
                </p>
              </div>
            )}

            <dl className="space-y-4 mb-6">
              <div className="flex justify-between">
                <dt className="text-cream-600">Subtotal ({totalItems} item{totalItems !== 1 ? 's' : ''})</dt>
                <dd className="font-medium text-gray-900">{formatPrice(subtotal.toString())}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-cream-600">Delivery Fee</dt>
                <dd className="font-medium text-gray-900">{formatPrice(deliveryFee.toString())}</dd>
              </div>
              <div className="flex justify-between pt-4 border-t border-cream-200">
                <dt className="text-lg font-semibold text-gray-900">Total</dt>
                <dd className="text-lg font-bold text-green-600">{formatPrice(total.toString())}</dd>
              </div>
            </dl>

            <p className="text-xs text-cream-500 mb-6 text-center">
              Delivery fee will be calculated at checkout based on your location and delivery method.
            </p>

            <Link
              href="/shop"
              className="block mb-3 w-full text-center px-6 py-3 text-base font-medium rounded-xl border border-cream-200 bg-white text-gray-700 hover:bg-cream-50 hover:border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
            >
              Continue Shopping
            </Link>
            <Link
              href="/checkout"
              className={`block w-full text-center px-6 py-3 text-base font-medium rounded-xl bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${items.length === 0 ? 'pointer-events-none opacity-50' : ''}`}
              aria-disabled={items.length === 0}
            >
              Proceed to Checkout
            </Link>

            <p className="mt-4 text-center text-xs text-cream-500">
              Secure checkout powered by Twelve09 Kiddies Store
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}