'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DealProduct {
  id: number | string;
  name: string;
  price: number;
  original_price?: number;
  image: string;
  slug: string;
}

export default function DealsPage() {
  const [deals, setDeals] = useState<DealProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/products?on_sale=true')
      .then((res) => res.json())
      .then((data) => {
        setDeals(data.products || data || []);
        setLoading(false);
      })
      .catch(() => {
        setDeals([
          { id: 1, name: 'Toddler Summer Promo Set', price: 15000, original_price: 25000, image: '/placeholder.png', slug: 'toddler-summer-promo' },
          { id: 2, name: 'Kiddies Play Mat Bundle', price: 12000, original_price: 18000, image: '/placeholder.png', slug: 'play-mat-bundle' },
          { id: 3, name: 'Back-to-School Combo', price: 20000, original_price: 30000, image: '/placeholder.png', slug: 'school-combo' },
        ]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="py-20 text-center font-bold text-green-800">Loading special deals...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 rounded-2xl bg-green-900 p-8 text-white shadow-md">
        <h1 className="text-3xl font-black">Special Deals & Discounts</h1>
        <p className="mt-2 text-green-100">Grab the best offers for your little ones before they sell out!</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {deals.map((product) => (
          <div key={product.id} className="group relative flex flex-col overflow-hidden rounded-2xl border border-cream-200 bg-white p-4 shadow-sm transition-all hover:shadow-md">
            <Link href={`/products/${product.slug || product.id}`} className="aspect-square overflow-hidden rounded-xl bg-cream-100">
              <img src={product.image || '/placeholder.png'} alt={product.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
            </Link>
            <div className="mt-4 flex flex-1 flex-col justify-between">
              <div>
                <Link href={`/products/${product.slug || product.id}`} className="text-base font-bold text-gray-900 hover:text-green-700">
                  {product.name}
                </Link>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <span className="text-lg font-black text-green-800">₦{product.price.toLocaleString()}</span>
                {product.original_price && (
                  <span className="text-sm font-semibold text-gray-400 line-through">₦{product.original_price.toLocaleString()}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
