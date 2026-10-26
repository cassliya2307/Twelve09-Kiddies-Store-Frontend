'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCategories } from '@/lib/api';
import type { Category } from '@/types/api';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getCategories()
      .then((data) => {
        if (cancelled) return;
        setCategories(data);
        setError(false);
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
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-green-800 font-bold" role="status" aria-live="polite">Loading categories...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-black text-green-900">Shop by Category</h1>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center" role="alert">
          <p className="font-semibold text-red-700">We couldn&apos;t load categories. Please try again later.</p>
        </div>
      ) : categories.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-gray-600">No categories are available right now. Please check back soon.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.id}`}
              className="group flex flex-col items-center justify-center rounded-2xl border border-cream-200 bg-white p-6 shadow-sm transition-all hover:border-green-500 hover:shadow-md"
            >
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-2xl font-bold text-green-800 group-hover:bg-green-100">
                {category.name.charAt(0)}
              </div>
              <h2 className="text-lg font-bold text-gray-900 group-hover:text-green-700">{category.name}</h2>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
