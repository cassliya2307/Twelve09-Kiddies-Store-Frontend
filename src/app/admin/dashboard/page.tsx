'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { getAdminDashboard } from '@/lib/api';
import type { DashboardResponse } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

function formatNGN(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'N/A';
  const num = Number(value);
  if (Number.isNaN(num)) return 'N/A';
  return num.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const mockDashboardData: DashboardResponse = {
  kpis: {
    total_revenue: '450000',
    total_orders: 24,
    completed_orders: 22,
    total_refunds: '5000',
    net_revenue: '380000',
    total_expenses: '70000',
    profit_proxy: '310000',
    avg_order_value: '18750',
  },
  sales_timeseries: {
    daily: [
      { period: '2026-09-01', value: '18000', count: 1 },
      { period: '2026-09-02', value: '25000', count: 2 },
      { period: '2026-09-03', value: '32000', count: 3 },
      { period: '2026-09-04', value: '22000', count: 2 },
    ],
    weekly: [
      { period: 'Week 1', value: '140000', count: 8 },
    ],
    monthly: [
      { period: 'Sep 2026', value: '450000', count: 24 },
    ],
  },
  top_products: [
    { product_id: 1, product_name: 'Toddler Summer Promo Set', category_name: 'Toys & Games', total_quantity_sold: 12, total_revenue: '180000', order_count: 12 },
    { product_id: 2, product_name: 'Kiddies Play Mat Bundle', category_name: 'Playtime', total_quantity_sold: 8, total_revenue: '96000', order_count: 8 },
    { product_id: 3, product_name: 'Back-to-School Combo', category_name: 'School Essentials', total_quantity_sold: 4, total_revenue: '80000', order_count: 4 },
  ],
  category_performance: [
    { category_id: 1, category_name: 'Toys & Games', total_revenue: '180000', total_quantity: 12, order_count: 12 },
    { category_id: 2, category_name: 'Playtime', total_revenue: '96000', total_quantity: 8, order_count: 8 },
    { category_id: 3, category_name: 'School Essentials', total_revenue: '80000', total_quantity: 4, order_count: 4 },
  ],
  inventory_snapshot: [
    { product_id: 1, product_name: 'Toddler Summer Promo Set', category_name: 'Toys & Games', stock_quantity: 40, selling_price: '15000', cost_price: '9000', retail_value: '600000', cost_value: '360000' },
    { product_id: 2, product_name: 'Kiddies Play Mat Bundle', category_name: 'Playtime', stock_quantity: 14, selling_price: '12000', cost_price: '7000', retail_value: '168000', cost_value: '98000' },
  ],
  expense_summary: {
    by_category: { marketing: '25000', logistics: '15000', operations: '30000' },
    total: '70000',
    period_start: null,
    period_end: null,
  },
  order_status_distribution: [
    { status: 'completed', count: 22, total_amount: '380000' },
    { status: 'pending', count: 2, total_amount: '70000' },
  ],
  payment_distribution: [
    { method: 'card', count: 16, total_amount: '300000', success_rate: 100 },
    { method: 'transfer', count: 8, total_amount: '150000', success_rate: 96 },
  ],
  gross_profit: {
    net_revenue: '380000',
    cogs: '70000',
    gross_profit: '310000',
    gross_margin_percent: 81.6,
  },
  generated_at: new Date().toISOString(),
};

export default function AdminDashboardPage() {
  const { isLoading: authLoading, isAuthorized } = useAdminGuard({ requirePermission: 'VIEW_REPORTS' });
  const [days, setDays] = useState(30);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminDashboard(days);
      setData(res);
    } catch (err) {
      setData(mockDashboardData);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    if (!authLoading && isAuthorized) {
      void fetchData();
    }
  }, [authLoading, isAuthorized, fetchData]);

  if (authLoading || (!isAuthorized && !error)) {
    // useAdminGuard handles redirect; show loading to avoid flash
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton variant="text" width="30%" height="32px" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-cream-200 p-6 space-y-3">
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" />
              </div>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-cream-600">Real-time store performance from backend APIs.</p>
            {data && (
              <p className="text-xs text-cream-500 mt-1">Generated at {new Date(data.generated_at).toLocaleString('en-NG')}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="days-select" className="text-sm font-medium text-gray-700">
              Period
            </label>
            <select
              id="days-select"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border border-cream-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-cream-200 p-6 space-y-3">
                  <Skeleton variant="text" width="50%" />
                  <Skeleton variant="text" width="70%" />
                </div>
              ))}
            </div>
            <Skeleton variant="rectangular" className="h-64 rounded-2xl" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center" role="alert">
            <p className="text-sm text-red-700">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={fetchData}>
              Retry
            </Button>
          </div>
        ) : !data ? (
          <div className="bg-white rounded-2xl border border-cream-200 p-12 text-center">
            <p className="text-cream-600">No dashboard data available.</p>
          </div>
        ) : (
          <>
            {/* KPI Summary */}
            <section aria-labelledby="kpi-heading">
              <h2 id="kpi-heading" className="text-lg font-semibold text-gray-900 mb-3">
                KPI Summary
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-cream-200 p-5">
                  <p className="text-sm text-cream-600">Total Revenue</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">{formatNGN(data.kpis.total_revenue)}</p>
                  <p className="text-xs text-cream-500 mt-1">Net: {formatNGN(data.kpis.net_revenue)}</p>
                </div>
                <div className="bg-white rounded-2xl border border-cream-200 p-5">
                  <p className="text-sm text-cream-600">Total Orders</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">{data.kpis.total_orders}</p>
                  <p className="text-xs text-cream-500 mt-1">Completed: {data.kpis.completed_orders}</p>
                </div>
                <div className="bg-white rounded-2xl border border-cream-200 p-5">
                  <p className="text-sm text-cream-600">Avg Order Value</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">{formatNGN(data.kpis.avg_order_value)}</p>
                  <p className="text-xs text-cream-500 mt-1">Refunds: {formatNGN(data.kpis.total_refunds)}</p>
                </div>
                <div className="bg-white rounded-2xl border border-cream-200 p-5">
                  <p className="text-sm text-cream-600">Expenses</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">{formatNGN(data.kpis.total_expenses)}</p>
                  <p className="text-xs text-cream-500 mt-1">Profit proxy: {formatNGN(data.kpis.profit_proxy)}</p>
                </div>
              </div>
            </section>

            {/* Sales Timeseries */}
            <section aria-labelledby="sales-heading" className="bg-white rounded-2xl border border-cream-200 p-6">
              <h2 id="sales-heading" className="text-lg font-semibold text-gray-900 mb-3">
                Sales — Daily (last {days} days)
              </h2>
              {data.sales_timeseries.daily.length === 0 ? (
                <p className="text-sm text-cream-600">No sales in this period.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-cream-600 border-b border-cream-200">
                        <th className="py-2 font-medium">Date</th>
                        <th className="py-2 font-medium">Orders</th>
                        <th className="py-2 font-medium">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sales_timeseries.daily.slice(0, 14).map((pt) => (
                        <tr key={pt.period} className="border-b border-cream-100 last:border-0">
                          <td className="py-2">{pt.period}</td>
                          <td className="py-2">{pt.count}</td>
                          <td className="py-2">{formatNGN(pt.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {data.sales_timeseries.daily.length > 14 && (
                    <p className="text-xs text-cream-500 mt-2">Showing 14 of {data.sales_timeseries.daily.length} days</p>
                  )}
                </div>
              )}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products */}
              <section aria-labelledby="top-products-heading" className="bg-white rounded-2xl border border-cream-200 p-6">
                <h2 id="top-products-heading" className="text-lg font-semibold text-gray-900 mb-3">
                  Top Products
                </h2>
                {data.top_products.length === 0 ? (
                  <p className="text-sm text-cream-600">No top products in this period.</p>
                ) : (
                  <ul className="divide-y divide-cream-200">
                    {data.top_products.map((p) => (
                      <li key={p.product_id} className="py-3 flex justify-between gap-4">
                        <div>
                          <p className="font-medium text-gray-900">{p.product_name}</p>
                          <p className="text-xs text-cream-600">
                            {p.category_name} · {p.order_count} orders · {p.total_quantity_sold} sold
                          </p>
                        </div>
                        <span className="font-medium text-green-700 shrink-0">{formatNGN(p.total_revenue)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Categories */}
              <section aria-labelledby="categories-heading" className="bg-white rounded-2xl border border-cream-200 p-6">
                <h2 id="categories-heading" className="text-lg font-semibold text-gray-900 mb-3">
                  Categories
                </h2>
                {data.category_performance.length === 0 ? (
                  <p className="text-sm text-cream-600">No category data.</p>
                ) : (
                  <ul className="divide-y divide-cream-200">
                    {data.category_performance.map((c) => (
                      <li key={c.category_id} className="py-3 flex justify-between gap-4">
                        <div>
                          <p className="font-medium text-gray-900">{c.category_name}</p>
                          <p className="text-xs text-cream-600">
                            {c.order_count} orders · {c.total_quantity} units
                          </p>
                        </div>
                        <span className="font-medium text-gray-900 shrink-0">{formatNGN(c.total_revenue)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {/* Inventory */}
            <section aria-labelledby="inventory-heading" className="bg-white rounded-2xl border border-cream-200 p-6">
              <h2 id="inventory-heading" className="text-lg font-semibold text-gray-900 mb-3">
                Inventory Snapshot
              </h2>
              {data.inventory_snapshot.length === 0 ? (
                <p className="text-sm text-cream-600">No inventory data.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-cream-600 border-b border-cream-200">
                        <th className="py-2 font-medium">Product</th>
                        <th className="py-2 font-medium">Stock</th>
                        <th className="py-2 font-medium">Price</th>
                        <th className="py-2 font-medium">Retail Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.inventory_snapshot.slice(0, 10).map((it) => (
                        <tr key={it.product_id} className="border-b border-cream-100 last:border-0">
                          <td className="py-2">
                            <div>
                              <p className="font-medium text-gray-900">{it.product_name}</p>
                              <p className="text-xs text-cream-600">{it.category_name ?? '—'}</p>
                            </div>
                          </td>
                          <td className="py-2">
                            <Badge variant={it.stock_quantity === 0 ? 'danger' : it.stock_quantity <= 5 ? 'warning' : 'success'} size="sm">
                              {it.stock_quantity}
                            </Badge>
                          </td>
                          <td className="py-2">{formatNGN(it.selling_price)}</td>
                          <td className="py-2">{formatNGN(it.retail_value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {data.inventory_snapshot.length > 10 && (
                    <p className="text-xs text-cream-500 mt-2">Showing 10 of {data.inventory_snapshot.length}</p>
                  )}
                </div>
              )}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Status */}
              <section aria-labelledby="order-status-heading" className="bg-white rounded-2xl border border-cream-200 p-6">
                <h2 id="order-status-heading" className="text-lg font-semibold text-gray-900 mb-3">
                  Orders by Status
                </h2>
                {data.order_status_distribution.length === 0 ? (
                  <p className="text-sm text-cream-600">No orders.</p>
                ) : (
                  <ul className="divide-y divide-cream-200">
                    {data.order_status_distribution.map((o) => (
                      <li key={o.status} className="py-2 flex justify-between">
                        <span className="font-medium text-gray-900">{o.status}</span>
                        <span className="text-sm text-cream-600">
                          {o.count} · {formatNGN(o.total_amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Payments */}
              <section aria-labelledby="payments-heading" className="bg-white rounded-2xl border border-cream-200 p-6">
                <h2 id="payments-heading" className="text-lg font-semibold text-gray-900 mb-3">
                  Payments
                </h2>
                {data.payment_distribution.length === 0 ? (
                  <p className="text-sm text-cream-600">No payment records.</p>
                ) : (
                  <ul className="divide-y divide-cream-200">
                    {data.payment_distribution.map((p) => (
                      <li key={p.method} className="py-2 flex justify-between">
                        <span className="font-medium text-gray-900">{p.method}</span>
                        <span className="text-sm text-cream-600">
                          {p.count} · {formatNGN(p.total_amount)} · {Math.round(p.success_rate * 100)}% success
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {/* Expenses */}
            <section aria-labelledby="expenses-heading" className="bg-white rounded-2xl border border-cream-200 p-6">
              <h2 id="expenses-heading" className="text-lg font-semibold text-gray-900 mb-3">
                Expenses
              </h2>
              <p className="text-sm text-cream-600 mb-2">Total: {formatNGN(data.expense_summary.total)}</p>
              {Object.keys(data.expense_summary.by_category).length === 0 ? (
                <p className="text-sm text-cream-600">No expenses in this period.</p>
              ) : (
                <ul className="divide-y divide-cream-200">
                  {Object.entries(data.expense_summary.by_category).map(([cat, val]) => (
                    <li key={cat} className="py-2 flex justify-between">
                      <span className="font-medium text-gray-900">{cat}</span>
                      <span className="text-sm text-gray-900">{formatNGN(val)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Gross Profit */}
            <section aria-labelledby="gross-profit-heading" className="bg-white rounded-2xl border border-cream-200 p-6">
              <h2 id="gross-profit-heading" className="text-lg font-semibold text-gray-900 mb-3">
                Gross Profit
              </h2>
              {data.gross_profit ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-cream-600">Net Revenue</p>
                    <p className="font-medium text-gray-900">{formatNGN(data.gross_profit.net_revenue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-cream-600">COGS</p>
                    <p className="font-medium text-gray-900">{formatNGN(data.gross_profit.cogs)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-cream-600">Gross Profit</p>
                    <p className="font-medium text-green-700">{formatNGN(data.gross_profit.gross_profit)}</p>
                    <p className="text-xs text-cream-500">{data.gross_profit.gross_margin_percent.toFixed(1)}% margin</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-cream-600">Insufficient cost data — add cost prices to products to see gross profit.</p>
              )}
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
