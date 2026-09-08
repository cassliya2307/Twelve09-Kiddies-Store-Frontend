'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { getProducts, getCategories, updateProductStock } from '@/lib/api';
import type { ProductListItem, Category } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

function formatNGN(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  return num.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function AdminInventoryPage() {
  const { isLoading: authLoading, isAuthorized } = useAdminGuard({ requirePermission: 'MANAGE_INVENTORY' });

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  const [editing, setEditing] = useState<ProductListItem | null>(null);
  const [stockInput, setStockInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, prods] = await Promise.all([
        getCategories(),
        getProducts({ include_inactive: true, search: debouncedSearch || undefined }),
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    if (!authLoading && isAuthorized) void fetchData();
  }, [authLoading, isAuthorized, fetchData]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const openEdit = (p: ProductListItem) => {
    setEditing(p);
    setStockInput(String(p.stock_quantity ?? 0));
    setFormError(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const raw = stockInput.trim();
    if (raw === '') {
      setFormError('Stock quantity is required');
      return;
    }
    const num = Number(raw);
    if (!Number.isInteger(num) || Number.isNaN(num) || num < 0) {
      setFormError('Stock must be an integer ≥ 0');
      return;
    }
    setUpdatingId(editing.id);
    setFormError(null);
    try {
      const updated = await updateProductStock(editing.id, num);
      setSuccess(`Stock updated for "${updated.name}" to ${updated.stock_quantity}`);
      setEditing(null);
      await fetchData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update stock');
    } finally {
      setUpdatingId(null);
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
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-cream-600">Manage stock quantities. Zero-stock products remain visible.</p>
        </div>

        <div className="bg-white rounded-2xl border border-cream-200 p-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="inventory-search" className="sr-only">
              Search inventory
            </label>
            <input
              id="inventory-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name or description"
              className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="text-sm text-cream-600 flex items-center">
            {loading ? 'Loading...' : `${products.length} product${products.length !== 1 ? 's' : ''}`}
          </div>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4" role="status">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4" role="alert">
            <p className="text-sm text-red-700">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={fetchData}>
              Retry
            </Button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-cream-200 p-6 flex gap-4">
                <Skeleton variant="rectangular" className="w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="text" width="60%" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 && !error ? (
          <div className="bg-white rounded-2xl border border-cream-200 p-12 text-center">
            <p className="text-cream-600">No inventory items found.</p>
            <p className="text-sm text-cream-500 mt-1">Try a different search or check product status.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-cream-50 border-b border-cream-200 text-left">
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      Product
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      Category
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      Price
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      Stock
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
                  {products.map((p) => {
                    const cat = categories.find((c) => c.id === p.category_id);
                    const isOut = p.stock_quantity === 0;
                    const isInactive = !p.is_active;
                    return (
                      <tr key={p.id} className="border-b border-cream-100 last:border-0 hover:bg-cream-50/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {p.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-xl object-cover bg-cream-100" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-cream-100 flex items-center justify-center text-cream-400 text-xs">No img</div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900 line-clamp-1">{p.name}</p>
                              <p className="text-xs text-cream-500">ID {p.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-cream-600">{cat?.name ?? `#${p.category_id}`}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{formatNGN(p.price)}</td>
                        <td className="px-4 py-3">
                          <span className={isOut ? 'text-red-600 font-medium' : 'text-gray-900'}>{p.stock_quantity}</span>
                        </td>
                        <td className="px-4 py-3">
                          {isInactive ? (
                            <Badge variant="danger" size="sm">
                              Inactive
                            </Badge>
                          ) : isOut ? (
                            <Badge variant="danger" size="sm">
                              Out of Stock
                            </Badge>
                          ) : (
                            <Badge variant="success" size="sm">
                              In Stock
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(p)}
                            disabled={updatingId === p.id}
                            aria-label={`Update stock for ${p.name}`}
                          >
                            Update Stock
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => !updatingId && setEditing(null)} aria-hidden="true" />
            <div className="relative bg-white rounded-2xl border border-cream-200 w-full max-w-md p-6">
              <h2 className="text-lg font-bold text-gray-900">Update Stock</h2>
              <p className="text-sm text-cream-600 mt-1">
                {editing.name} — current: {editing.stock_quantity}
              </p>

              {formError && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3" role="alert">
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              )}

              <form onSubmit={handleUpdate} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="stock-quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    id="stock-quantity"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    value={stockInput}
                    onChange={(e) => setStockInput(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                    aria-describedby="stock-help"
                  />
                  <p id="stock-help" className="text-xs text-cream-500 mt-1">
                    Integer ≥ 0. Zero means out of stock (still visible).
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={!!updatingId} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" loading={updatingId === editing.id} disabled={updatingId === editing.id} className="flex-1">
                    Save
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
