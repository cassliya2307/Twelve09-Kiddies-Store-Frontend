'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProducts } from '@/lib/api';

export default function DealsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hasProducts, setHasProducts] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    getProducts()
      .then((products) => {
        if (!cancelled) setHasProducts(products.length > 0);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 rounded-2xl bg-green-900 p-8 text-white shadow-md">
        <h1 className="text-3xl font-black">Special Deals & Discounts</h1>
        <p className="mt-2 text-green-100">Check back for special offers for your little ones.</p>
      </div>

      {loading ? (
        <p className="py-12 text-center font-bold text-green-800" role="status" aria-live="polite">Checking for special offers…</p>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center" role="alert">
          <p className="font-semibold text-red-700">We couldn&apos;t check for special offers. Please try again.</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError(false);
              setRetryCount((count) => count + 1);
            }}
            className="mt-4 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-cream-200 bg-white p-8 text-center">
          {hasProducts ? (
            <>
              <p className="font-semibold text-gray-900">Special deals aren&apos;t available right now.</p>
              <p className="mt-2 text-sm text-gray-600">Our product data doesn&apos;t currently include sale prices or discount information, so we can&apos;t verify which items are on offer.</p>
              <Link href="/shop" className="mt-4 inline-block text-sm font-bold text-green-800 hover:text-green-700">
                Browse all products
              </Link>
            </>
          ) : (
            <p className="font-semibold text-gray-900">No products are currently available to feature in special deals.</p>
          )}
        </div>
      )}
    </div>
  );
}
