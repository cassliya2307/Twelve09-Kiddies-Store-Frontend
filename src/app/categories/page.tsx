'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Category {
  id: number | string;
  name: string;
  slug: string;
  image?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/categories')
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories || data || []);
        setLoading(false);
      })
      .catch(() => {
        setCategories([
          { id: 1, name: 'Baby Boys', slug: 'baby-boys' },
          { id: 2, name: 'Baby Girls', slug: 'baby-girls' },
          { id: 3, name: 'Toys & Games', slug: 'toys-games' },
          { id: 4, name: 'School Essentials', slug: 'school-essentials' },
        ]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-green-800 font-bold">Loading categories...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-black text-green-900">Shop by Category</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/shop?category=${cat.slug}`}
            className="group flex flex-col items-center justify-center rounded-2xl border border-cream-200 bg-white p-6 shadow-sm transition-all hover:border-green-500 hover:shadow-md"
          >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-2xl font-bold text-green-800 group-hover:bg-green-100">
              {cat.name.charAt(0)}
            </div>
            <h2 className="text-lg font-bold text-gray-900 group-hover:text-green-700">{cat.name}</h2>
          </Link>
        ))}
      </div>
    </div>
  );
}
