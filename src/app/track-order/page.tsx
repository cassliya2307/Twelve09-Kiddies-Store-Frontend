'use client';

import { FormEvent, useState } from 'react';

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [orderStatus, setOrderStatus] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = (e: FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setLoading(true);

    setTimeout(() => {
      setOrderStatus({
        id: orderId,
        status: 'Out for Delivery',
        date: 'Sept 10, 2026',
        items: 'Toddler Summer Promo Set (x1)',
        total: '₦15,000',
      });
      setLoading(false);
    }, 600);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-black text-green-900">Track Your Order</h1>
      <p className="mb-8 text-sm text-gray-500">
        Enter your order ID below to check its real-time fulfillment status.
      </p>

      <form onSubmit={handleTrack} className="mb-8 flex gap-3">
        <input
          type="text"
          placeholder="e.g. ORD-9382"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          className="flex-1 rounded-xl border border-cream-300 bg-white px-4 py-3 text-sm focus:border-green-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-green-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-green-800 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Track'}
        </button>
      </form>

      {orderStatus && (
        <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <p className="text-xs font-bold uppercase text-gray-400">Order ID</p>
              <h2 className="text-lg font-black text-gray-900">{orderStatus.id}</h2>
            </div>
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
              {orderStatus.status}
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <p>
              <span className="font-bold text-gray-500">Placed on:</span> {orderStatus.date}
            </p>
            <p>
              <span className="font-bold text-gray-500">Items:</span> {orderStatus.items}
            </p>
            <p>
              <span className="font-bold text-gray-500">Total Amount:</span>{' '}
              <span className="font-black text-green-800">{orderStatus.total}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
