'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { getCategories, createCategory, getProducts } from '@/lib/api';
import type { Category } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

export default function AdminCategoriesPage() {
  const { isLoading: authLoading, isAuthorized } = useAdminGuard({ requireAdmin: true });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [productCounts, setProductCounts] = useState<Record<number, number>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, products] = await Promise.all([
        getCategories(),
        getProducts({ include_inactive: true, limit: 100 }),
      ]);
      setCategories(cats);
      const counts: Record<number, number> = {};
      for (const p of products) {
        counts[p.category_id] = (counts[p.category_id] || 0) + 1;
      }
      setProductCounts(counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthorized) void fetchData();
  }, [authLoading, isAuthorized, fetchData]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('Name is required');
      return;
    }
    if (trimmedName.length > 150) {
      setFormError('Name must be ≤150 characters');
      return;
    }
    if (description && description.length > 1000) {
      setFormError('Description must be ≤1000 characters');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const created = await createCategory({ name: trimmedName, description: description.trim() || null });
      setSuccess(`Category "${created.name}" created`);
      setName('');
      setDescription('');
      setShowForm(false);
      await fetchData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setSubmitting(false);
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
            <p className="text-sm text-cream-600">Manage product categories. Creation is Admin-only.</p>
          </div>
          <Button variant="primary" size="md" onClick={() => { setShowForm(true); setFormError(null); }}>
            Create Category
          </Button>
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
                <Skeleton variant="text" width="30%" />
                <Skeleton variant="text" width="50%" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 && !error ? (
          <div className="bg-white rounded-2xl border border-cream-200 p-12 text-center">
            <p className="text-cream-600">No categories found.</p>
            <p className="text-sm text-cream-500 mt-1">Create your first category to organize products.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-cream-50 border-b border-cream-200 text-left">
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      Name
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      Description
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      Products
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      ID
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id} className="border-b border-cream-100 last:border-0 hover:bg-cream-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                      <td className="px-4 py-3 text-cream-600 max-w-xs truncate">{c.description || '—'}</td>
                      <td className="px-4 py-3 text-center">{productCounts[c.id] ?? 0}</td>
                      <td className="px-4 py-3">
                        <Badge variant={c.is_active ? 'success' : 'danger'} size="sm">
                          {c.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-cream-500">#{c.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-cream-50 border-t border-cream-200 text-xs text-cream-600">
              Editing and deletion are not currently supported by the backend. Contact development if needed.
            </div>
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => !submitting && setShowForm(false)} aria-hidden="true" />
            <div className="relative bg-white rounded-2xl border border-cream-200 w-full max-w-lg p-6">
              <h2 className="text-lg font-bold text-gray-900">Create Category</h2>
              <p className="text-sm text-cream-600 mt-1">Name must be unique. Active status is default.</p>

              {formError && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3" role="alert">
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              )}

              <form onSubmit={handleCreate} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="cat-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    id="cat-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={150}
                    placeholder="e.g., Toys"
                    className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label htmlFor="cat-desc" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="cat-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder="Optional description"
                    className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-cream-500 mt-1">{description.length}/1000</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} disabled={submitting} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" loading={submitting} disabled={submitting} className="flex-1">
                    Create
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
