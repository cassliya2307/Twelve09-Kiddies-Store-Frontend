'use client';

import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';

interface CategoryShortcutsProps {
  categories: { id: number; name: string; description: string | null }[];
  isLoading?: boolean;
  error?: string | null;
}

const categoryIcons: Record<string, React.ReactNode> = {
  'Educational': (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  'Creative': (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  'Outdoor': (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  'Games': (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2M9 19l12-3" />
    </svg>
  ),
  'Plush': (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
};

export function CategoryShortcuts({ categories, isLoading, error }: CategoryShortcutsProps) {
  if (isLoading) {
    return (
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Shop by Category</h2>
            <p className="mt-2 text-cream-600">Explore our curated collections</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {[...Array(6)].map((_, i) => (
              <CategoryCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-cream-600">Unable to load categories. Please try again later.</p>
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

  if (!categories || categories.length === 0) {
    return (
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-cream-600">No categories available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  const displayCategories = categories.slice(0, 6);

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Shop by Category</h2>
          <p className="mt-2 text-cream-600">Explore our curated collections</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {displayCategories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.id}`}
              className="group"
            >
              <article className="text-center p-4 sm:p-6 rounded-2xl bg-cream-50 border border-cream-200 hover:border-green-300 hover:bg-white hover:shadow-lg transition-all duration-300">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-cream-200 group-hover:bg-green-50 group-hover:border-green-200 transition-colors duration-300 mb-4 mx-auto">
                  {categoryIcons[category.name] || (
                    <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-sm text-cream-800 mt-1 line-clamp-2">{category.description}</p>
                )}
              </article>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium transition-colors"
          >
            View All Categories
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

function CategoryCardSkeleton() {
  return (
    <article className="text-center p-6 rounded-2xl bg-cream-50 border border-cream-200">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-cream-200 mb-4 mx-auto">
        <Skeleton variant="circular" className="w-8 h-8" />
      </div>
      <Skeleton variant="text" width="70%" className="mx-auto" />
    </article>
  );
}