/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/Header';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } from '@/lib/api';
import type { Address, AddressCreate } from '@/types/api';

// Validation helpers matching backend schema
function validateAddressForm(data: AddressCreate): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.recipient_name || data.recipient_name.trim().length < 2) {
    errors.recipient_name = 'Recipient name must be at least 2 characters';
  } else if (data.recipient_name.trim().length > 150) {
    errors.recipient_name = 'Recipient name must be at most 150 characters';
  }
  if (!data.phone_number || data.phone_number.trim().length < 7) {
    errors.phone_number = 'Phone number must be at least 7 characters';
  } else if (data.phone_number.trim().length > 30) {
    errors.phone_number = 'Phone number must be at most 30 characters';
  }
  if (!data.address_line || data.address_line.trim().length < 5) {
    errors.address_line = 'Address must be at least 5 characters';
  } else if (data.address_line.trim().length > 255) {
    errors.address_line = 'Address must be at most 255 characters';
  }
  if (!data.city || data.city.trim().length < 2) {
    errors.city = 'City must be at least 2 characters';
  } else if (data.city.trim().length > 100) {
    errors.city = 'City must be at most 100 characters';
  }
  if (!data.state || data.state.trim().length < 2) {
    errors.state = 'State must be at least 2 characters';
  } else if (data.state.trim().length > 100) {
    errors.state = 'State must be at most 100 characters';
  }
  if (data.additional_directions && data.additional_directions.length > 1000) {
    errors.additional_directions = 'Additional directions must be at most 1000 characters';
  }
  return errors;
}

type FormMode = 'add' | 'edit' | null;

export default function AddressesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<AddressCreate>({
    recipient_name: '',
    phone_number: '',
    address_line: '',
    city: '',
    state: '',
    additional_directions: '',
    is_default: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const formRef = useRef<HTMLDivElement>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showSuccess = useCallback((msg: string) => {
    setSuccessMessage(msg);
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    successTimeoutRef.current = setTimeout(() => setSuccessMessage(null), 4000);
  }, []);

  // Redirect unauthenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/account/addresses');
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchAddresses = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setFetchError(null);
    try {
      const data = await getAddresses();
      setAddresses(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load addresses';
      // Handle auth errors
      if (msg.toLowerCase().includes('unauthorized') || msg.includes('401')) {
        setFetchError('Please sign in to view your addresses.');
      } else {
        setFetchError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchAddresses();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, fetchAddresses]);

  // Clear global errors after timeout
  useEffect(() => {
    if (globalError) {
      const t = setTimeout(() => setGlobalError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [globalError]);

  const resetForm = () => {
    setFormData({
      recipient_name: '',
      phone_number: '',
      address_line: '',
      city: '',
      state: '',
      additional_directions: '',
      is_default: false,
    });
    setFieldErrors({});
    setFormError(null);
  };

  const openAddForm = () => {
    resetForm();
    setEditingId(null);
    setFormMode('add');
    setDeleteConfirmId(null);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  };

  const openEditForm = (address: Address) => {
    setFormData({
      recipient_name: address.recipient_name,
      phone_number: address.phone_number,
      address_line: address.address_line,
      city: address.city,
      state: address.state,
      additional_directions: address.additional_directions || '',
      is_default: address.is_default,
    });
    setEditingId(address.id);
    setFormMode('edit');
    setFieldErrors({});
    setFormError(null);
    setDeleteConfirmId(null);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  };

  const closeForm = () => {
    setFormMode(null);
    setEditingId(null);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const trimmedData: AddressCreate = {
      recipient_name: formData.recipient_name.trim(),
      phone_number: formData.phone_number.trim(),
      address_line: formData.address_line.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      additional_directions: formData.additional_directions?.trim() || null,
      is_default: formData.is_default,
    };

    // For update, don't send is_default via updateAddress if we want to keep logic simple - backend handles it
    const errors = validateAddressForm(trimmedData);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError('Please correct the highlighted fields.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (formMode === 'edit' && editingId !== null) {
        await updateAddress(editingId, trimmedData);
        showSuccess('Address updated successfully.');
      } else {
        await createAddress(trimmedData);
        showSuccess('Address added successfully.');
      }
      closeForm();
      await fetchAddresses();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save address';
      // Friendly handling of common HTTP errors
      if (message.toLowerCase().includes('not found') || message.includes('404')) {
        setFormError('Address not found. It may have been removed.');
      } else if (message.toLowerCase().includes('forbidden') || message.includes('403')) {
        setFormError('You do not have permission to modify this address.');
      } else if (message.toLowerCase().includes('unauthorized') || message.includes('401')) {
        setFormError('Session expired. Please sign in again.');
      } else {
        setFormError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (deletingId !== null) return;
    setDeletingId(id);
    setGlobalError(null);
    try {
      await deleteAddress(id);
      setAddresses(prev => prev.filter(a => a.id !== id));
      // If deleted was default, refetch to get new default assigned by backend
      const deletedWasDefault = addresses.find(a => a.id === id)?.is_default;
      if (deletedWasDefault) {
        await fetchAddresses();
      }
      setDeleteConfirmId(null);
      showSuccess('Address deleted successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete address';
      if (message.includes('409') || message.toLowerCase().includes('referenced')) {
        setGlobalError('Cannot delete an address that is linked to an existing order.');
      } else if (message.toLowerCase().includes('not found') || message.includes('404')) {
        setGlobalError('Address not found. It may have already been deleted.');
        // Refresh list
        await fetchAddresses();
        setDeleteConfirmId(null);
      } else if (message.toLowerCase().includes('forbidden') || message.includes('403')) {
        setGlobalError('You do not have permission to delete this address.');
      } else {
        setGlobalError(message);
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: number) => {
    if (settingDefaultId !== null) return;
    const prevAddresses = [...addresses];
    setSettingDefaultId(id);
    setGlobalError(null);
    try {
      const updated = await setDefaultAddress(id);
      // Update UI after confirmed backend success
      setAddresses(prev => prev.map(a => ({
        ...a,
        is_default: a.id === updated.id ? true : false,
      })));
      showSuccess('Default address updated.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set default address';
      // Keep previous default state on failure
      setAddresses(prevAddresses);
      if (message.toLowerCase().includes('not found') || message.includes('404')) {
        setGlobalError('Address not found.');
        await fetchAddresses();
      } else if (message.toLowerCase().includes('forbidden') || message.includes('403')) {
        setGlobalError('You do not have permission to update this address.');
      } else {
        setGlobalError(message);
      }
    } finally {
      setSettingDefaultId(null);
    }
  };

  // Loading state
  if (authLoading || (loading && isAuthenticated)) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
          <Skeleton variant="text" width="40%" height="32px" className="mb-2" />
          <Skeleton variant="text" width="55%" height="16px" className="mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-cream-200 p-6 space-y-3">
                <Skeleton variant="text" width="50%" />
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="60%" />
                <div className="flex gap-2 pt-2">
                  <Skeleton variant="rectangular" className="h-9 w-20 rounded-xl" />
                  <Skeleton variant="rectangular" className="h-9 w-20 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </main>
        <MobileBottomNav />
      </>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {/* Breadcrumb & header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Saved Addresses</h1>
            <p className="mt-1 text-cream-600">Manage your delivery addresses for faster checkout.</p>
          </div>
          <Button variant="primary" size="md" onClick={openAddForm} disabled={submitting || formMode !== null} className="w-full sm:w-auto shrink-0">
            Add New Address
          </Button>
        </div>

        {/* Navigation pills */}
        <nav className="mt-6 flex flex-wrap gap-3" aria-label="Account navigation">
          <Link
            href="/account"
            className="px-4 py-2 rounded-xl text-sm font-medium border border-cream-200 text-gray-700 hover:bg-cream-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Account
          </Link>
          <Link
            href="/orders"
            className="px-4 py-2 rounded-xl text-sm font-medium border border-cream-200 text-gray-700 hover:bg-cream-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            My Orders
          </Link>
          <Link
            href="/account/addresses"
            aria-current="page"
            className="px-4 py-2 rounded-xl text-sm font-medium bg-green-100 text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Addresses
          </Link>
          <Link
            href="/shop"
            className="px-4 py-2 rounded-xl text-sm font-medium border border-cream-200 text-gray-700 hover:bg-cream-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Shop
          </Link>
        </nav>

        {/* Success / error banners */}
        <div aria-live="polite" className="mt-6 space-y-3">
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4" role="status">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          )}
          {globalError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4" role="alert">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-700">{globalError}</p>
              </div>
            </div>
          )}
          {fetchError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4" role="alert">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-red-700">{fetchError}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={fetchAddresses}>
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit form */}
        {formMode && (
          <div ref={formRef} className="mt-6 bg-white rounded-2xl border border-cream-200 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{formMode === 'edit' ? 'Edit Address' : 'Add New Address'}</h2>
              <button
                type="button"
                onClick={closeForm}
                className="p-2 rounded-xl text-cream-500 hover:bg-cream-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                aria-label="Close form"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {formError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3" role="alert" aria-live="assertive">
                <p className="text-sm text-red-700">{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="recipient_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient Name <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="recipient_name"
                    type="text"
                    value={formData.recipient_name}
                    onChange={e => setFormData({ ...formData, recipient_name: e.target.value })}
                    required
                    aria-required="true"
                    aria-invalid={!!fieldErrors.recipient_name}
                    aria-describedby={fieldErrors.recipient_name ? 'err-recipient_name' : undefined}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${fieldErrors.recipient_name ? 'border-red-300 bg-red-50' : 'border-cream-200'}`}
                    placeholder="Full name"
                    disabled={submitting}
                  />
                  {fieldErrors.recipient_name && (
                    <p id="err-recipient_name" className="mt-1 text-sm text-red-600" role="alert">
                      {fieldErrors.recipient_name}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                    required
                    aria-required="true"
                    aria-invalid={!!fieldErrors.phone_number}
                    aria-describedby={fieldErrors.phone_number ? 'err-phone_number' : undefined}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${fieldErrors.phone_number ? 'border-red-300 bg-red-50' : 'border-cream-200'}`}
                    placeholder="08012345678"
                    disabled={submitting}
                  />
                  {fieldErrors.phone_number && (
                    <p id="err-phone_number" className="mt-1 text-sm text-red-600" role="alert">
                      {fieldErrors.phone_number}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="address_line" className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <input
                  id="address_line"
                  type="text"
                  value={formData.address_line}
                  onChange={e => setFormData({ ...formData, address_line: e.target.value })}
                  required
                  aria-required="true"
                  aria-invalid={!!fieldErrors.address_line}
                  aria-describedby={fieldErrors.address_line ? 'err-address_line' : undefined}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${fieldErrors.address_line ? 'border-red-300 bg-red-50' : 'border-cream-200'}`}
                  placeholder="Street address, house number"
                  disabled={submitting}
                />
                {fieldErrors.address_line && (
                  <p id="err-address_line" className="mt-1 text-sm text-red-600" role="alert">
                    {fieldErrors.address_line}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    City <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    required
                    aria-required="true"
                    aria-invalid={!!fieldErrors.city}
                    aria-describedby={fieldErrors.city ? 'err-city' : undefined}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${fieldErrors.city ? 'border-red-300 bg-red-50' : 'border-cream-200'}`}
                    placeholder="Lagos"
                    disabled={submitting}
                  />
                  {fieldErrors.city && (
                    <p id="err-city" className="mt-1 text-sm text-red-600" role="alert">
                      {fieldErrors.city}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                    State <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="state"
                    type="text"
                    value={formData.state}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                    required
                    aria-required="true"
                    aria-invalid={!!fieldErrors.state}
                    aria-describedby={fieldErrors.state ? 'err-state' : undefined}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${fieldErrors.state ? 'border-red-300 bg-red-50' : 'border-cream-200'}`}
                    placeholder="Lagos State"
                    disabled={submitting}
                  />
                  {fieldErrors.state && (
                    <p id="err-state" className="mt-1 text-sm text-red-600" role="alert">
                      {fieldErrors.state}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="additional_directions" className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Directions
                </label>
                <textarea
                  id="additional_directions"
                  value={formData.additional_directions || ''}
                  onChange={e => setFormData({ ...formData, additional_directions: e.target.value })}
                  rows={3}
                  aria-invalid={!!fieldErrors.additional_directions}
                  aria-describedby={fieldErrors.additional_directions ? 'err-additional_directions' : undefined}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none ${fieldErrors.additional_directions ? 'border-red-300 bg-red-50' : 'border-cream-200'}`}
                  placeholder="Landmarks, building description"
                  disabled={submitting}
                />
                {fieldErrors.additional_directions && (
                  <p id="err-additional_directions" className="mt-1 text-sm text-red-600" role="alert">
                    {fieldErrors.additional_directions}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="is_default"
                  type="checkbox"
                  checked={!!formData.is_default}
                  onChange={e => setFormData({ ...formData, is_default: e.target.checked })}
                  className="h-4 w-4 rounded border-cream-200 text-green-600 focus:ring-green-500"
                  disabled={submitting}
                />
                <label htmlFor="is_default" className="text-sm text-gray-700">
                  Set as default address
                </label>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={closeForm} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="flex-1" loading={submitting} disabled={submitting}>
                  {formMode === 'edit' ? 'Update Address' : 'Save Address'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Addresses list */}
        {!fetchError && !loading && addresses.length === 0 && !formMode && (
          <div className="mt-6 text-center bg-white rounded-2xl border border-cream-200 py-16 px-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cream-100" aria-hidden="true">
              <svg className="h-8 w-8 text-cream-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="mt-6 text-xl font-bold text-gray-900">No saved addresses yet.</h2>
            <p className="mt-2 text-cream-600">Add your delivery address to make checkout faster.</p>
            <Button variant="primary" size="lg" className="mt-6" onClick={openAddForm}>
              Add Address
            </Button>
          </div>
        )}

        {!loading && !fetchError && addresses.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map(address => (
              <article
                key={address.id}
                className={`bg-white rounded-2xl border-2 p-6 flex flex-col transition-colors ${address.is_default ? 'border-green-200 bg-green-50/30' : 'border-cream-200'}`}
                aria-label={`Address for ${address.recipient_name}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-gray-900">{address.recipient_name}</h2>
                    {address.is_default && (
                      <Badge variant="success" size="sm" aria-label="Default address">
                        Default
                      </Badge>
                    )}
                  </div>
                  {address.is_default && (
                    <span className="sr-only">This is your default delivery address</span>
                  )}
                </div>

                <div className="mt-3 space-y-1 text-sm text-gray-700">
                  <p>{address.address_line}</p>
                  <p>
                    {address.city}, {address.state}
                  </p>
                  <p className="text-cream-600">{address.phone_number}</p>
                  {address.additional_directions && (
                    <p className="text-cream-500 text-sm pt-1 border-t border-cream-100 mt-2">
                      {address.additional_directions}
                    </p>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditForm(address)} disabled={submitting || !!deletingId || !!settingDefaultId}>
                    Edit
                  </Button>
                  {!address.is_default && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSetDefault(address.id)}
                      disabled={!!settingDefaultId || !!deletingId || !!submitting}
                      loading={settingDefaultId === address.id}
                      aria-label={`Set address for ${address.recipient_name} as default`}
                    >
                      Set as Default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirmId(address.id)}
                    disabled={!!deletingId || !!settingDefaultId || !!submitting}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    aria-label={`Delete address for ${address.recipient_name}`}
                  >
                    Delete
                  </Button>
                </div>

                {/* Delete confirmation inline */}
                {deleteConfirmId === address.id && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4" role="alertdialog" aria-modal="true" aria-labelledby={`delete-title-${address.id}`} aria-describedby={`delete-desc-${address.id}`}>
                    <h3 id={`delete-title-${address.id}`} className="text-sm font-semibold text-red-800">
                      Delete this address?
                    </h3>
                    <p id={`delete-desc-${address.id}`} className="mt-1 text-sm text-red-700">
                      Are you sure you want to remove this saved address? This action cannot be undone.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirmId(null)}
                        disabled={deletingId === address.id}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleDelete(address.id)}
                        loading={deletingId === address.id}
                        disabled={deletingId === address.id}
                        className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-500"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {/* Helper text for checkout */}
        {addresses.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-cream-600">
              Your addresses will be available at checkout. Your default address is automatically selected.
            </p>
            <Link href="/checkout" className="inline-block mt-3 text-sm font-medium text-green-600 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 rounded">
              Go to Checkout →
            </Link>
          </div>
        )}
      </main>
      <MobileBottomNav />
    </>
  );
}
