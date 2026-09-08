'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { getOrders, getOrder, cancelOrder, updateOrderStatus, getPaymentForOrder } from '@/lib/api';
import type { Order, Payment } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

function formatNGN(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  return num.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const ALL_STATUSES: Order['status'][] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'];

function getValidNextStatuses(current: Order['status'], fulfillment: Order['fulfillment_method']): Order['status'][] {
  // Mirrors backend _validate_order_status_transition
  const base: Record<string, Set<string>> = {
    PENDING: new Set(['CONFIRMED', 'CANCELLED']),
    CONFIRMED: new Set(['PROCESSING', 'CANCELLED']),
    PROCESSING: new Set(['CANCELLED']),
    READY_FOR_PICKUP: new Set(['COMPLETED', 'CANCELLED']),
    OUT_FOR_DELIVERY: new Set(['COMPLETED', 'CANCELLED']),
    COMPLETED: new Set([]),
    CANCELLED: new Set([]),
  };
  if (fulfillment === 'STORE_PICKUP') {
    base.PROCESSING = new Set(['READY_FOR_PICKUP', 'CANCELLED']);
  } else if (fulfillment === 'STORE_DELIVERY' || fulfillment === 'CUSTOMER_DISPATCH') {
    base.PROCESSING = new Set(['OUT_FOR_DELIVERY', 'CANCELLED']);
    base.READY_FOR_PICKUP = new Set([]);
  }
  const allowed = base[current] || new Set();
  return ALL_STATUSES.filter((s) => allowed.has(s));
}

export default function AdminOrdersPage() {
  const { isLoading: authLoading, isAuthorized } = useAdminGuard({ requirePermission: 'MANAGE_ORDERS' });

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selected, setSelected] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrders();
      // backend already desc, but ensure
      const sorted = [...data].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setOrders(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthorized) void fetchList();
  }, [authLoading, isAuthorized, fetchList]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const openDetail = async (orderId: number) => {
    setDetailLoading(true);
    try {
      const [o, p] = await Promise.all([getOrder(orderId), getPaymentForOrder(orderId).catch(() => null)]);
      setSelected(o);
      setPayment(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: Order['status']) => {
    if (!selected || statusUpdating) return;
    setStatusUpdating(true);
    setError(null);
    try {
      const updated = await updateOrderStatus(selected.id, newStatus);
      setSelected(updated);
      setSuccess(`Order #${updated.id} status updated to ${newStatus}`);
      await fetchList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!selected || cancelling) return;
    setCancelling(true);
    try {
      const updated = await cancelOrder(selected.id);
      setSelected(updated);
      setSuccess(`Order #${updated.id} cancelled`);
      setCancelConfirm(false);
      await fetchList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Skeleton variant="text" width="30%" height="32px" />
          <Skeleton variant="rectangular" className="h-64 rounded-2xl" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-cream-600">Manage all customer orders. Totals and payment amounts are server-authoritative.</p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4" role="status">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4" role="alert">
            <p className="text-sm text-red-700">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={fetchList}>
              Retry
            </Button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-cream-200 p-6 space-y-3">
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" width="60%" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 && !error ? (
          <div className="bg-white rounded-2xl border border-cream-200 p-12 text-center">
            <p className="text-cream-600">No orders found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-cream-50 border-b border-cream-200 text-left">
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      Order
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      Customer
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      Date
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      Total
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      Fulfillment
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b border-cream-100 last:border-0 hover:bg-cream-50/50">
                      <td className="px-4 py-3 font-mono font-medium text-gray-900">#{o.id}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{o.delivery_recipient_name || `User #${o.user_id}`}</p>
                          <p className="text-xs text-cream-500">{o.delivery_phone_number || ''}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-cream-600">{formatDate(o.created_at)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{formatNGN(o.total_amount)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="default" size="sm">
                          {o.fulfillment_method}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={o.status === 'CANCELLED' ? 'danger' : o.status === 'COMPLETED' ? 'success' : o.status === 'PENDING' ? 'warning' : 'info'} size="sm">
                          {o.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="outline" size="sm" onClick={() => openDetail(o.id)} disabled={detailLoading}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-cream-50 border-t border-cream-200 text-xs text-cream-600">
              {orders.length} order{orders.length !== 1 ? 's' : ''} total. No search/pagination on backend — all orders returned.
            </div>
          </div>
        )}

        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => !cancelling && !statusUpdating && setSelected(null)} aria-hidden="true" />
            <div className="relative bg-white rounded-2xl border border-cream-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white p-6 border-b border-cream-200 flex justify-between items-start gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Order #{selected.id}</h2>
                  <p className="text-sm text-cream-600">{formatDate(selected.created_at)} · {selected.fulfillment_method}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelected(null)} aria-label="Close details">
                  Close
                </Button>
              </div>

              <div className="p-6 space-y-6">
                {detailLoading ? (
                  <Skeleton variant="rectangular" className="h-32 rounded-xl" />
                ) : (
                  <>
                    <section>
                      <h3 className="font-semibold text-gray-900 mb-2">Customer & Delivery</h3>
                      <div className="bg-cream-50 rounded-xl p-4 text-sm space-y-1">
                        <p>
                          <span className="text-cream-600">Customer ID:</span> {selected.user_id}
                        </p>
                        <p>
                          <span className="text-cream-600">Recipient:</span> {selected.delivery_recipient_name || '—'}
                        </p>
                        <p>
                          <span className="text-cream-600">Phone:</span> {selected.delivery_phone_number || '—'}
                        </p>
                        <p>
                          <span className="text-cream-600">Address:</span> {selected.delivery_address_line ? `${selected.delivery_address_line}, ${selected.delivery_city || ''} ${selected.delivery_state || ''}` : 'Store Pickup — no address'}
                        </p>
                      </div>
                    </section>

                    <section>
                      <h3 className="font-semibold text-gray-900 mb-2">Items</h3>
                      <ul className="divide-y divide-cream-200 border rounded-xl">
                        {(selected.order_items ?? []).map((it) => (
                          <li key={it.id} className="p-4 flex justify-between gap-4">
                            <div>
                              <p className="font-medium text-gray-900">Product #{it.product_id}</p>
                              <p className="text-xs text-cream-600">Qty {it.quantity} × {formatNGN(it.unit_price)}</p>
                            </div>
                            <span className="font-medium text-gray-900">{formatNGN(it.subtotal)}</span>
                          </li>
                        ))}
                      </ul>
                    </section>

                    <section className="bg-white border rounded-xl p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Totals</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-cream-600">Subtotal</span>
                          <span className="font-medium">{formatNGN(selected.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cream-600">Delivery Fee</span>
                          <span className="font-medium">{selected.fulfillment_method === 'STORE_PICKUP' && Number(selected.delivery_fee) === 0 ? 'Free' : formatNGN(selected.delivery_fee)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t font-bold">
                          <span>Total</span>
                          <span className="text-green-700">{formatNGN(selected.total_amount)}</span>
                        </div>
                      </div>
                    </section>

                    <section className="bg-white border rounded-xl p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Payment</h3>
                      {payment ? (
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="text-cream-600">Method:</span> {payment.payment_method}
                          </p>
                          <p>
                            <span className="text-cream-600">Status:</span> <Badge variant={payment.status === 'SUCCESS' ? 'success' : payment.status === 'FAILED' ? 'danger' : 'warning'} size="sm">{payment.status}</Badge>
                          </p>
                          <p>
                            <span className="text-cream-600">Amount:</span> {formatNGN(payment.amount)}
                          </p>
                          {payment.provider_reference && (
                            <p className="text-xs font-mono break-all">Ref: {payment.provider_reference}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-cream-600">No payment record.</p>
                      )}
                    </section>

                    <section className="flex flex-wrap gap-3">
                      <div className="flex-1 min-w-[180px]">
                        <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 mb-1">
                          Change Status
                        </label>
                        <select
                          id="status-select"
                          defaultValue=""
                          onChange={(e) => {
                            const val = e.target.value as Order['status'];
                            if (val) handleStatusChange(val);
                            e.target.value = '';
                          }}
                          disabled={statusUpdating}
                          className="w-full px-3 py-2 rounded-xl border border-cream-200 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Select status...</option>
                          {getValidNextStatuses(selected.status, selected.fulfillment_method).map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-cream-500 mt-1">Only valid transitions offered.</p>
                      </div>
                      <div className="flex items-end">
                        <Button
                          variant="ghost"
                          size="md"
                          onClick={() => setCancelConfirm(true)}
                          disabled={cancelling || statusUpdating || selected.status === 'CANCELLED' || selected.status === 'COMPLETED'}
                          className="text-red-600 hover:bg-red-50"
                        >
                          Cancel Order
                        </Button>
                      </div>
                    </section>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {cancelConfirm && selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="cancel-title">
            <div className="absolute inset-0 bg-black/40" onClick={() => !cancelling && setCancelConfirm(false)} aria-hidden="true" />
            <div className="relative bg-white rounded-2xl border border-cream-200 w-full max-w-md p-6">
              <h2 id="cancel-title" className="text-lg font-bold text-gray-900">
                Cancel Order #{selected.id}?
              </h2>
              <p className="text-sm text-cream-600 mt-2">This will cancel the order and restore stock. Cannot be undone via UI. Payment status is not changed automatically.</p>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setCancelConfirm(false)} disabled={cancelling}>
                  Keep Order
                </Button>
                <Button variant="primary" className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleCancel} loading={cancelling} disabled={cancelling}>
                  Confirm Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
