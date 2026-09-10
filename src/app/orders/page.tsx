'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { getOrders, getPaymentForOrder, getProduct } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/format';
import { getOrderStatusView, getPaymentStatusView } from '@/lib/statusLabels';
import type { Order, Payment, Product } from '@/types/api';

export default function OrdersPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { addToCart, getCartQuantity } = useCart();

  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentMap, setPaymentMap] = useState<Record<number, Payment | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const [reorderingId, setReorderingId] = useState<number | null>(null);
  const [reorderFeedback, setReorderFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/orders');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    const run = async () => {
      try {
        const data = await getOrders();
        if (cancelled) return;
        const sorted = [...data].sort(
          (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
        );
        setOrders(sorted);

        const payments = await Promise.all(
          sorted.map((order) =>
            getPaymentForOrder(order.id)
              .then((p) => [order.id, p] as const)
              .catch(() => [order.id, null] as const)
          )
        );
        const map: Record<number, Payment | null> = {};
        payments.forEach(([id, p]) => {
          map[id] = p;
        });
        setPaymentMap(map);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load your orders');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, retryNonce]);

  if (authLoading || (!isAuthenticated && !error)) {
    return (
      <>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
          <Skeleton variant="text" width="30%" height="32px" className="mb-6" />
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-cream-200 p-6">
                <Skeleton variant="text" width="40%" />
                <div className="mt-3 flex justify-between">
                  <Skeleton variant="text" width="25%" />
                  <Skeleton variant="text" width="20%" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <MobileBottomNav />
      </>
    );
  }

  return (
    <>
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="mt-1 text-cream-600">Review your order history and track each purchase.</p>

        <nav className="mt-6 flex flex-wrap gap-3" aria-label="Account navigation">
          <Link
            href="/account"
            className="px-4 py-2 rounded-xl text-sm font-medium border border-cream-200 text-gray-700 hover:bg-cream-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Account
          </Link>
          <Link
            href="/orders"
            aria-current="page"
            className="px-4 py-2 rounded-xl text-sm font-medium bg-green-100 text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            My Orders
          </Link>
          <Link
            href="/shop"
            className="px-4 py-2 rounded-xl text-sm font-medium border border-cream-200 text-gray-700 hover:bg-cream-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Shop
          </Link>
        </nav>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4" role="alert">
            <p className="text-sm text-red-700">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setRetryNonce((n) => n + 1)}>
              Try Again
            </Button>
          </div>
        )}

        {loading && !error && (
          <div className="mt-6 space-y-4" aria-live="polite">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-cream-200 p-6">
                <Skeleton variant="text" width="40%" />
                <div className="mt-3 flex justify-between">
                  <Skeleton variant="text" width="25%" />
                  <Skeleton variant="text" width="20%" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="mt-10 text-center bg-white rounded-2xl border border-cream-200 py-16 px-6">
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
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <h2 className="mt-6 text-xl font-bold text-gray-900">You haven&apos;t placed any orders yet</h2>
            <p className="mt-2 text-cream-600">
              When you place an order, it will appear here so you can check its status anytime.
            </p>
            <Link href="/shop" className="mt-6 inline-block">
              <Button variant="primary" size="lg">
                Start Shopping
              </Button>
            </Link>
          </div>
        )}

        {reorderFeedback && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4" role="status" aria-live="polite">
            <p className="text-sm text-amber-800">{reorderFeedback}</p>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <ul className="mt-6 space-y-4">
            {orders.map((order) => {
              const orderView = getOrderStatusView(order.status);
              const payment = paymentMap[order.id];
              const paymentView = payment ? getPaymentStatusView(payment.status) : null;
              const itemCount = order.order_items?.length ?? 0;

              const handleReorder = async (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                if (reorderingId !== null) return;
                setReorderingId(order.id);
                setReorderFeedback(null);

                const items = order.order_items ?? [];
                if (items.length === 0) {
                  setReorderFeedback("This order has no items to reorder.");
                  setReorderingId(null);
                  return;
                }

                try {
                  // Collect unique product IDs
                  const uniqueProductIds = [...new Set(items.map((item) => item.product_id))];
                  // Fetch all products in parallel
                  const products = await Promise.all(
                    uniqueProductIds.map((id) => getProduct(id).catch(() => null))
                  );
                  const productMap = new Map(
                    products
                      .filter((p): p is Product => p !== null)
                      .map((p) => [p.id, p])
                  );

                  let addedCount = 0;
                  let partialCount = 0;
                  let skippedInactive = 0;
                  let skippedOutOfStock = 0;

                  for (const item of items) {
                    const product = productMap.get(item.product_id);
                    if (!product || !product.is_active) {
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
                    let msg = `${addedCount} item${addedCount !== 1 ? 's' : ''} added to your cart. Current prices and stock were applied.`;
                    if (partialCount > 0) msg += ` ${partialCount} item(s) added with reduced quantity due to limited stock.`;
                    if (skippedInactive > 0) msg += ` ${skippedInactive} item(s) couldn't be added because they are no longer available.`;
                    if (skippedOutOfStock > 0) msg += ` ${skippedOutOfStock} item(s) couldn't be added because they are out of stock.`;
                    setReorderFeedback(msg);
                    router.push('/cart');
                  } else {
                    let msg = "This order can't be reordered right now because its items are no longer available.";
                    if (skippedOutOfStock > 0) msg = "No items could be added — some items are out of stock. " + msg;
                    if (skippedInactive > 0) msg = "No items could be added — items are no longer available. " + msg;
                    setReorderFeedback(msg);
                  }
                } catch {
                  setReorderFeedback("Failed to process reorder. Please try again.");
                }
                setReorderingId(null);
              };

              return (
                <li key={order.id} className="bg-white rounded-2xl border border-cream-200 p-6">
                  <Link
                    href={`/orders/${order.id}`}
                    className="block focus:outline-none focus:ring-2 focus:ring-green-500 rounded-xl -m-1 p-1"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-cream-500">Order #{order.id}</p>
                        <p className="text-sm text-cream-600">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={orderView.variant} size="sm">
                          {orderView.label}
                        </Badge>
                        {paymentView && (
                          <Badge variant={paymentView.variant} size="sm">
                            {paymentView.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-cream-600">
                        {itemCount} item{itemCount !== 1 ? 's' : ''}
                      </p>
                      <p className="text-lg font-bold text-green-600">{formatPrice(order.total_amount)}</p>
                    </div>
                  </Link>
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReorder}
                      loading={reorderingId === order.id}
                      disabled={reorderingId !== null}
                      aria-label={`Reorder order ${order.id}`}
                    >
                      Reorder
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <MobileBottomNav />
    </>
  );
}
