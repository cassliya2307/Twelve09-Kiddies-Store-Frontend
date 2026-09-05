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
      <section className="py-12 sm:py-16 lg:py-20 bg-cream-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">{title}</h2>
            <p className="mt-1 text-cream-600">Handpicked favorites for your little ones</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <section className="py-12 sm:py-16 lg:py-20 bg-cream-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-cream-600">Unable to load products. Please try again later.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-green-600 hover:text-green-700 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) {
    return (
      <section className="py-12 sm:py-16 lg:py-20 bg-cream-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-cream-600">No products available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-cream-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">{title}</h2>
            <p className="mt-1 text-cream-600">Handpicked favorites for your little ones</p>
          </div>
          <Link
            href={href}
            className="hidden sm:inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium transition-colors"
          >
            View All
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="text-center mt-8 sm:hidden">
          <Link
            href={href}
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium transition-colors"
          >
            View All Products
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProductCardSkeleton() {
  return (
    <Skeleton className="h-48 w-full rounded-lg mb-4" />
  );
}