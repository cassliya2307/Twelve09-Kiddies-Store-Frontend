'use client';

import { useAuth } from '@/context/AuthContext';
import { getOrders } from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/format';
import { getFulfillmentLabel, getOrderStatusView } from '@/lib/statusLabels';
import type { Order } from '@/types/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface ProfileAddress {
  id: number;
  title: string;
  address: string;
  isDefault: boolean;
}

export default function ProfilePage() {
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'account'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(false);
  const [retryOrders, setRetryOrders] = useState(0);
  const [addresses, setAddresses] = useState<ProfileAddress[]>([
    { id: 1, title: 'Home / Delivery', address: '12 Lekki Expressway, Victoria Island, Lagos', isDefault: true },
  ]);
  const [newAddressText, setNewAddressText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/profile');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    let cancelled = false;
    getOrders()
      .then((data) => {
        if (cancelled) return;
        setOrders(data);
        setOrdersError(false);
      })
      .catch(() => {
        if (!cancelled) setOrdersError(true);
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, retryOrders]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressText.trim()) return;
    const newAddr = {
      id: Date.now(),
      title: 'Delivery Address',
      address: newAddressText,
      isDefault: addresses.length === 0,
    };
    setAddresses([...addresses, newAddr]);
    setNewAddressText('');
    setShowAddForm(false);
  };

  const handleSetDefault = (id: number) => {
    setAddresses(
      addresses.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    );
  };

  const role = user?.role?.toLowerCase();

  if (authLoading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10" role="status" aria-live="polite">
        <p className="text-sm text-gray-500">Checking your account…</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10" role="status" aria-live="polite">
        <p className="text-sm text-gray-500">Redirecting to sign in…</p>
      </main>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Top Banner / Header */}
      <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-cream-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-2xl font-black text-green-900">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">{user?.name || 'Customer'}</h1>
            <p className="text-sm text-gray-500">{user?.email || 'No email provided'}</p>
            <span className="mt-1 inline-block rounded-full bg-green-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-green-700">
              {user?.role || 'Customer'}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="self-start rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition-colors hover:bg-red-100"
        >
          Log Out
        </button>
      </div>

      {/* Role-Based Admin/Staff Shortcut Banner */}
      {(role === 'admin' || role === 'staff' || user?.isAdmin) && (
        <div className="mb-8 flex items-center justify-between rounded-2xl bg-green-900 p-6 text-white shadow-md">
          <div>
            <h2 className="text-lg font-bold">Management Access</h2>
            <p className="text-sm text-green-100">You are logged in with {role} permissions.</p>
          </div>
          <Link
            href={role === 'staff' ? '/staff/dashboard' : '/admin/dashboard'}
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-green-900 transition-colors hover:bg-green-50"
          >
            Open {role === 'staff' ? 'Staff' : 'Admin'} Dashboard
          </Link>
        </div>
      )}

      {/* Profile Navigation Tabs */}
      <div className="mb-6 flex gap-2 border-b border-cream-200 pb-4">
        <button
          onClick={() => setActiveTab('orders')}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
            activeTab === 'orders' ? 'bg-green-900 text-white' : 'border border-cream-200 bg-white text-gray-600 hover:bg-cream-100'
          }`}
        >
          My Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('addresses')}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
            activeTab === 'addresses' ? 'bg-green-900 text-white' : 'border border-cream-200 bg-white text-gray-600 hover:bg-cream-100'
          }`}
        >
          Saved Addresses ({addresses.length})
        </button>
        <button
          onClick={() => setActiveTab('account')}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
            activeTab === 'account' ? 'bg-green-900 text-white' : 'border border-cream-200 bg-white text-gray-600 hover:bg-cream-100'
          }`}
        >
          Account Details
        </button>
      </div>

      {/* Tab Content: Orders */}
      {activeTab === 'orders' && (
        <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Order History</h2>
          {ordersLoading ? (
            <p className="text-sm text-gray-500" role="status" aria-live="polite">Loading your orders…</p>
          ) : ordersError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4" role="alert">
              <p className="text-sm text-red-700">We couldn&apos;t load your order history. Please try again.</p>
              <button
                type="button"
                onClick={() => {
                  setOrdersLoading(true);
                  setOrdersError(false);
                  setRetryOrders((attempt) => attempt + 1);
                }}
                className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
              >
                Try again
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-xl bg-cream-50 p-5 text-center">
              <p className="text-sm text-gray-600">You haven&apos;t placed any orders yet.</p>
              <Link href="/shop" className="mt-3 inline-block text-sm font-bold text-green-800 hover:text-green-700">
                Browse the shop
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div key={ord.id} className="rounded-xl border border-cream-200 bg-white p-5">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">Order #{ord.id}</span>
                        <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-[10px] font-bold text-green-700">
                          {getOrderStatusView(ord.status).label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-400">Placed {formatDate(ord.created_at)}</p>
                      <p className="mt-2 text-xs text-gray-500">{getFulfillmentLabel(ord.fulfillment_method)}</p>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t border-cream-100 pt-3 sm:justify-end sm:border-t-0 sm:pt-0">
                      <span className="text-base font-black text-green-800">{formatPrice(ord.total_amount)}</span>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-cream-100 pt-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Items</p>
                    <ul className="space-y-2">
                      {ord.order_items.map((item) => (
                        <li key={item.id} className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm text-gray-700">
                          <span>Product #{item.product_id} × {item.quantity}</span>
                          <span>{formatPrice(item.subtotal)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Addresses */}
      {activeTab === 'addresses' && (
        <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Manage Delivery Addresses</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="rounded-xl bg-green-900 px-4 py-2 text-xs font-bold text-white hover:bg-green-800"
            >
              {showAddForm ? 'Cancel' : '+ Add New Address'}
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddAddress} className="mb-6 rounded-xl border border-green-200 bg-green-50/50 p-4">
              <label className="mb-2 block text-xs font-bold text-gray-700">New Delivery Address</label>
              <textarea
                rows={2}
                placeholder="Enter street, house number, area, and city..."
                value={newAddressText}
                onChange={(e) => setNewAddressText(e.target.value)}
                className="mb-3 w-full rounded-xl border border-cream-300 bg-white p-3 text-sm focus:border-green-600 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-green-900 px-5 py-2 text-xs font-bold text-white hover:bg-green-800"
              >
                Save Address
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {addresses.map((addr) => (
              <div key={addr.id} className="relative flex flex-col justify-between rounded-xl border border-cream-200 bg-cream-50/30 p-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-green-800">{addr.title}</span>
                    {addr.isDefault && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">Default</span>
                    )}
                  </div>
                  <p className="mb-4 text-xs leading-relaxed text-gray-700">{addr.address}</p>
                </div>
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="self-start rounded-lg border border-cream-300 bg-white px-3 py-1 text-[11px] font-bold text-gray-700 hover:border-green-600"
                  >
                    Set as Default
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Account Details */}
      {activeTab === 'account' && (
        <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Personal Information</h2>
          <div className="max-w-md space-y-4">
            <div>
              <p className="text-xs font-bold uppercase text-gray-400">Full Name</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{user?.name || 'Customer'}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-400">Email Address</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{user?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-400">Account Role</p>
              <p className="mt-1 text-sm font-semibold uppercase text-green-800">{user?.role || 'Customer'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
