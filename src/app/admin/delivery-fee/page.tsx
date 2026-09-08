'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { getDeliveryFee, updateDeliveryFee } from '@/lib/api';
import type { DeliveryFeeRead } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

function formatNGN(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  return num.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function AdminDeliveryFeePage() {
  const { isLoading: authLoading, isAuthorized } = useAdminGuard({ requireAdmin: true });

  const [config, setConfig] = useState<DeliveryFeeRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [feeInput, setFeeInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDeliveryFee();
      setConfig(data);
      setFeeInput(String(data.fee_amount));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load delivery fee');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthorized) void fetchConfig();
  }, [authLoading, isAuthorized, fetchConfig]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = feeInput.trim();
    if (trimmed === '') {
      setFormError('Fee amount is required');
      return;
    }
    const num = Number(trimmed);
    if (Number.isNaN(num) || num < 0) {
      setFormError('Fee must be a number ≥ 0');
      return;
    }
    // Enforce 2 decimal places max (backend decimal_places=2)
    if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
      setFormError('Fee must have at most 2 decimal places');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const updated = await updateDeliveryFee({ fee_amount: trimmed });
      setConfig(updated);
      setFeeInput(String(updated.fee_amount));
      setSuccess(`Delivery fee updated to ${formatNGN(updated.fee_amount)}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update fee');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Skeleton variant="text" width="30%" height="32px" />
          <Skeleton variant="rectangular" className="h-32 rounded-2xl" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Fee</h1>
          <p className="text-sm text-cream-600">Admin-only: configure the delivery fee applied to STORE_DELIVERY and CUSTOMER_DISPATCH orders. Pickup remains free.</p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4" role="status">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4" role="alert">
            <p className="text-sm text-red-700">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={fetchConfig}>
              Retry
            </Button>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl border border-cream-200 p-6 space-y-4">
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="rectangular" className="h-12 rounded-xl" />
          </div>
        ) : config ? (
          <>
            <div className="bg-white rounded-2xl border border-cream-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">Current Configuration</h2>
              <dl className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="text-cream-600">Current Fee</dt>
                  <dd className="font-bold text-gray-900 text-lg">{formatNGN(config.fee_amount)}</dd>
                  <dd className="text-xs text-cream-500">Applied to delivery orders</dd>
                </div>
                <div>
                  <dt className="text-cream-600">Currency</dt>
                  <dd className="font-medium text-gray-900">NGN</dd>
                </div>
                <div>
                  <dt className="text-cream-600">Status</dt>
                  <dd className="font-medium text-gray-900">{config.is_active ? 'Active' : 'Inactive'}</dd>
                </div>
              </dl>
              <div className="mt-4 p-3 bg-cream-50 rounded-xl text-xs text-cream-600">
                <p>Pickup orders are always free (backend rule). Historical orders retain their stored fee.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-cream-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">Update Fee</h2>
              <p className="text-sm text-cream-600 mt-1">Enter a new delivery fee. Backend validates ≥ 0 and persists to database.</p>

              {formError && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3" role="alert">
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="fee-amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Fee (NGN) *
                  </label>
                  <input
                    id="fee-amount"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={feeInput}
                    onChange={(e) => setFeeInput(e.target.value)}
                    required
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                    aria-describedby="fee-help"
                  />
                  <p id="fee-help" className="text-xs text-cream-500 mt-1">
                    Use 0 for free delivery. Max 2 decimal places.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setFeeInput(String(config.fee_amount))} disabled={submitting} className="flex-1">
                    Reset
                  </Button>
                  <Button type="submit" variant="primary" loading={submitting} disabled={submitting} className="flex-1">
                    Save Fee
                  </Button>
                </div>
              </form>
            </div>
          </>
        ) : (
          !error && (
            <div className="bg-white rounded-2xl border border-cream-200 p-12 text-center">
              <p className="text-cream-600">No delivery fee configuration found.</p>
            </div>
          )
        )}
      </div>
    </AdminLayout>
  );
}
