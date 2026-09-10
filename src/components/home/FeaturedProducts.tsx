'use client';

import Link from 'next/link';
import { ProductCard } from '@/components/ui/ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ProductListItem } from '@/types/api';

interface FeaturedProductsProps {
  products: ProductListItem[];
  isLoading?: boolean;
  error?: string | null;
  title?: string;
  href?: string;
}

export function FeaturedProducts({ products, isLoading, error, title = 'Featured Products', href = '/shop' }: FeaturedProductsProps) {
  if (isLoading) {
    return (
      <section className="bg-cream-50 py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-green-800">Little favorites</span>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-charcoal sm:text-4xl">{title}</h2>
            </div>
            <p className="mt-1 hidden text-sm font-bold text-cream-600 sm:block">Handpicked favorites for your little ones</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-cream-50 py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-cream-600">Unable to load products. Please try again later.</p>
            <button onClick={() => window.location.reload()} className="mt-4 text-green-600 hover:text-green-700 font-medium">
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) {
    return (
      <section className="bg-cream-50 py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-cream-600">No products available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-cream-50 py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-green-800">Little favorites</span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-charcoal sm:text-4xl">{title}</h2>
            <p className="mt-3 text-sm font-medium text-cream-700">Handpicked favorites for your little ones</p>
          </div>
          <Link href={href} className="hidden items-center gap-2 rounded-full border border-green-700 px-5 py-2 text-sm font-black uppercase tracking-wide text-green-800 transition hover:bg-green-700 hover:text-white sm:inline-flex">
            View All
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link href={href} className="inline-flex items-center gap-2 rounded-full border border-green-700 px-6 py-3 text-sm font-black uppercase tracking-wide text-green-800 transition hover:bg-green-700 hover:text-white">
            View All Products
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProductCardSkeleton() {
  return <Skeleton className="h-64 w-full rounded-[1.75rem]" />;
}