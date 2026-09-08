'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { usePermission } from '@/hooks/usePermission';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '@/lib/api';
import type { Expense } from '@/types/api';
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

interface ExpenseFormData {
  description: string;
  amount: string;
  category: string;
}

const emptyForm: ExpenseFormData = { description: '', amount: '', category: '' };

export default function AdminExpensesPage() {
  const { isLoading: authLoading, isAuthorized } = useAdminGuard({ requirePermission: 'MANAGE_EXPENSES' });
  const { isAdmin } = usePermission();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<ExpenseFormData>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Expense | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expenses');
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

  const openCreate = () => {
    setEditing(null);
    setFormData(emptyForm);
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (exp: Expense) => {
    if (!isAdmin) return;
    setEditing(exp);
    setFormData({ description: exp.description, amount: String(exp.amount), category: exp.category });
    setFormError(null);
    setShowForm(true);
  };

  const validate = (data: ExpenseFormData): string | null => {
    if (!data.description.trim() || data.description.trim().length < 2) return 'Description must be at least 2 characters';
    if (data.description.length > 1000) return 'Description too long';
    const amt = Number(data.amount);
    if (!data.amount || Number.isNaN(amt) || amt <= 0) return 'Amount must be > 0';
    if (!data.category.trim()) return 'Category is required';
    if (data.category.length > 100) return 'Category must be ≤100 characters';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate(formData);
    if (err) {
      setFormError(err);
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        description: formData.description.trim(),
        amount: formData.amount.trim(),
        category: formData.category.trim(),
      };
      if (editing) {
        await updateExpense(editing.id, payload);
        setSuccess('Expense updated successfully');
      } else {
        await createExpense(payload);
        setSuccess('Expense created successfully');
      }
      setShowForm(false);
      setEditing(null);
      await fetchData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (exp: Expense) => {
    if (!isAdmin || deletingId) return;
    setDeletingId(exp.id);
    try {
      await deleteExpense(exp.id);
      setSuccess('Expense deleted successfully');
      setDeleteConfirm(null);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete expense');
    } finally {
      setDeletingId(null);
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
            <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
            <p className="text-sm text-cream-600">Track store expenses. {isAdmin ? 'Admin can edit/delete.' : 'Staff can create and view own expenses.'}</p>
          </div>
          <Button variant="primary" size="md" onClick={openCreate}>
            Create Expense
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
              <div key={i} className="bg-white rounded-2xl border border-cream-200 p-6 space-y-3">
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" width="60%" />
              </div>
            ))}
          </div>
        ) : expenses.length === 0 && !error ? (
          <div className="bg-white rounded-2xl border border-cream-200 p-12 text-center">
            <p className="text-cream-600">No expenses found.</p>
            <p className="text-sm text-cream-500 mt-1">Create your first expense to track spending.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-cream-50 border-b border-cream-200 text-left">
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      Description
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      Category
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      Amount
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      Date
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="border-b border-cream-100 last:border-0 hover:bg-cream-50/50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{exp.description}</p>
                          <p className="text-xs text-cream-500">ID #{exp.id} · by {exp.recorded_by}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="default" size="sm">
                          {exp.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{formatNGN(exp.amount)}</td>
                      <td className="px-4 py-3 text-cream-600">{formatDate(exp.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {isAdmin ? (
                            <>
                              <Button variant="outline" size="sm" onClick={() => openEdit(exp)} disabled={!!deletingId}>
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteConfirm(exp)}
                                disabled={!!deletingId}
                                className="text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-cream-500">View only</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => !submitting && setShowForm(false)} aria-hidden="true" />
            <div className="relative bg-white rounded-2xl border border-cream-200 w-full max-w-lg p-6">
              <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit Expense' : 'Create Expense'}</h2>
              <p className="text-sm text-cream-600 mt-1">{editing ? 'Admin-only edit.' : 'All fields required.'}</p>

              {formError && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3" role="alert">
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="exp-desc" className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    id="exp-desc"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={3}
                    maxLength={1000}
                    className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label htmlFor="exp-amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (NGN) *
                  </label>
                  <input
                    id="exp-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label htmlFor="exp-category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <input
                    id="exp-category"
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    placeholder="e.g., Rent, Utilities"
                    className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} disabled={submitting} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" loading={submitting} disabled={submitting} className="flex-1">
                    {editing ? 'Save Changes' : 'Create Expense'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-title">
            <div className="absolute inset-0 bg-black/40" onClick={() => !deletingId && setDeleteConfirm(null)} aria-hidden="true" />
            <div className="relative bg-white rounded-2xl border border-cream-200 w-full max-w-md p-6">
              <h2 id="delete-title" className="text-lg font-bold text-gray-900">
                Delete Expense?
              </h2>
              <p className="text-sm text-cream-600 mt-2">This will permanently delete expense #{deleteConfirm.id}. Cannot be undone.</p>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)} disabled={!!deletingId}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={() => handleDelete(deleteConfirm)}
                  loading={deletingId === deleteConfirm.id}
                  disabled={deletingId === deleteConfirm.id}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
