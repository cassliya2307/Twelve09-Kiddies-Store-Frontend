'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/api';

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A–Z' },
  { value: 'name_desc', label: 'Name: Z–A' },
  { value: 'newest', label: 'Newest' },
] as const;

interface ShopFiltersProps {
  categories: Category[];
  search: string;
  setSearch: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  sort: string;
  setSort: (value: string) => void;
  hasActiveFilters: boolean;
}

export function ShopFilters({ categories, search, setSearch, category, setCategory, sort, setSort, hasActiveFilters }: ShopFiltersProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
  };

  const handleSortChange = (value: string) => {
    setSort(value);
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setSort('featured');
  };

  return (
    <div className="bg-white border-b border-cream-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <label htmlFor="product-search" className="sr-only">
                Search products
              </label>
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-cream-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="search"
                  id="product-search"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-cream-200 rounded-xl bg-cream-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  aria-label="Search products"
                  autoComplete="off"
                />
                {search && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-400 hover:text-cream-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:hidden">
              <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium rounded-xl border transition-colors',
                  isMobileOpen
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-cream-200 hover:border-green-300'
                )}
                aria-expanded={isMobileOpen}
                aria-controls="mobile-filters"
              >
                Filters
                <svg className="inline-block h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                </svg>
              </button>
            </div>
          </div>

          {isMobileOpen && (
            <div id="mobile-filters" className="mt-4 animate-slide-down space-y-4 sm:hidden">
              <div>
                <label htmlFor="mobile-category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="mobile-category"
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-cream-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="mobile-sort" className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  id="mobile-sort"
                  value={sort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-cream-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}

          <div className="hidden sm:flex sm:flex-row gap-3">
            <div className="w-56">
              <label htmlFor="category-filter" className="sr-only">
                Filter by category
              </label>
              <select
                id="category-filter"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-cream-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-56">
              <label htmlFor="sort-filter" className="sr-only">
                Sort products
              </label>
              <select
                id="sort-filter"
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-cream-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1.5"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}