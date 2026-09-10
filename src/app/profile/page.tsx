'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'account'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<any[]>([
    { id: 1, title: 'Home / Delivery', address: '12 Lekki Expressway, Victoria Island, Lagos', isDefault: true },
  ]);
  const [newAddressText, setNewAddressText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/api/orders/my-orders', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setOrders(data.orders || data || []))
      .catch(() => {
        setOrders([
          {
            id: 'ORD-9382',
            date: 'Sept 9, 2026',
            total: 15000,
            status: 'Shipped',
            items: 'Toddler Summer Promo Set (x1)',
            steps: [
              { title: 'Order Placed', completed: true, date: 'Sept 9, 10:00 AM' },
              { title: 'Order Packed', completed: true, date: 'Sept 9, 02:30 PM' },
              { title: 'Order Shipped', completed: true, date: 'Sept 10, 09:00 AM' },
              { title: 'Delivered', completed: false, date: 'Estimated Sept 11' },
            ],
          },
          {
            id: 'ORD-9383',
            date: 'Sept 10, 2026',
            total: 8500,
            status: 'Processing',
            items: 'Kiddies Play Mat Bundle (x1)',
            steps: [
              { title: 'Order Placed', completed: true, date: 'Sept 10, 11:15 AM' },
              { title: 'Order Packed', completed: false, date: 'Pending' },
              { title: 'Order Shipped', completed: false, date: 'Pending' },
              { title: 'Delivered', completed: false, date: 'Pending' },
            ],
          },
        ]);
      });
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const toggleTracking = (id: string) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
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
          <h2 className="mb-4 text-lg font-bold text-gray-900">Order History & Live Tracking</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-gray-500">You haven't placed any orders yet.</p>
          ) : (
            <div className="space-y-4">
              {orders.map((ord, idx) => (
                <div key={ord.id || idx} className="rounded-xl border border-cream-200 bg-white p-5">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{ord.id}</span>
                        <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-[10px] font-bold text-green-700">
                          {ord.status || 'Processing'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-400">{ord.date || 'Recent'}</p>
                      <p className="mt-2 text-xs font-semibold text-gray-700">{ord.items || 'Store purchase items'}</p>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t border-cream-100 pt-3 sm:justify-end sm:border-t-0 sm:pt-0">
                      <span className="text-base font-black text-green-800">₦{(ord.total || 0).toLocaleString()}</span>
                      <button
                        onClick={() => toggleTracking(ord.id)}
                        className="rounded-xl border border-green-700 bg-green-50 px-4 py-2 text-xs font-bold text-green-800 transition-colors hover:bg-green-100"
                      >
                        {expandedOrderId === ord.id ? 'Hide Tracking' : 'Track Order'}
                      </button>
                    </div>
                  </div>

                  {expandedOrderId === ord.id && (
                    <div className="mt-6 border-t border-cream-100 pt-5">
                      <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">Shipment Progress</p>
                      <div className="relative space-y-6 pl-6 before:absolute before:bottom-2 before:left-2.5 before:top-2 before:w-0.5 before:bg-green-200">
                        {(ord.steps || [
                          { title: 'Order Placed', completed: true, date: ord.date },
                          { title: 'Order Packed', completed: true, date: 'In progress' },
                          { title: 'Order Shipped', completed: false, date: 'Pending' },
                          { title: 'Delivered', completed: false, date: 'Pending' },
                        ]).map((step: any, stepIdx: number) => (
                          <div key={stepIdx} className="relative flex items-start gap-4">
                            <span className={`absolute -left-6 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                              step.completed ? 'bg-green-900 text-white' : 'bg-gray-200 text-gray-500'
                            }`}>
                              {step.completed ? '✓' : '•'}
                            </span>
                            <div>
                              <p className={`text-sm font-bold ${step.completed ? 'text-gray-900' : 'text-gray-400'}`}>{step.title}</p>
                              <p className="text-xs text-gray-500">{step.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
