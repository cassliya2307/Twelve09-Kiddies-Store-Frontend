'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ShopFilters } from '@/components/shop/ShopFilters';
import { ProductGrid } from '@/components/shop/ProductGrid';
import type { Category, ProductListItem } from '@/types/api';

interface ShopContentProps {
  categories: Category[];
  allProducts: ProductListItem[];
  initialSearch?: string;
  initialCategory?: string;
  initialSort?: string;
}

export function ShopContent({ categories, allProducts, initialSearch = '', initialCategory = '', initialSort = 'featured' }: ShopContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (category) params.set('category', category);
    if (sort && sort !== 'featured') params.set('sort', sort);
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
  }, [debouncedSearch, category, sort, pathname, router]);

  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      );
    }

    if (category) {
      result = result.filter((p) => p.category_id.toString() === category);
    }

    switch (sort) {
      case 'price_asc':
        result.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'price_desc':
        result.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        break;
      case 'featured':
      default:
        break;
    }

    return result;
  }, [allProducts, debouncedSearch, category, sort]);

  const hasActiveFilters = Boolean(debouncedSearch) || Boolean(category) || sort !== 'featured';

  return (
    <div className="bg-cream-50 min-h-[calc(100vh-200px)]">
      <ShopFilters
        categories={categories}
        search={search}
        setSearch={setSearch}
        category={category}
        setCategory={setCategory}
        sort={sort}
        setSort={setSort}
        hasActiveFilters={hasActiveFilters}
      />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 text-sm text-cream-600">
            <span className="font-medium text-gray-900">{filteredProducts.length}</span>
            <span>product{filteredProducts.length !== 1 ? 's' : ''} found</span>
            {hasActiveFilters && (
              <span className="text-green-600">(filtered from {allProducts.length})</span>
            )}
          </div>
        </div>
        <ProductGrid
          products={filteredProducts}
          isLoading={false}
          error={null}
        />
      </div>
    </div>
  );
}