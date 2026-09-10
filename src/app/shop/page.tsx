import type { Category, ProductListItem } from '@/types/api';

import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { CategorySection } from '@/components/home/CategorySection';
import { getCategories, getProducts } from '@/lib/api';
import type { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shop - Twelve09 Kiddies Store",
  description: "Browse our complete collection of toys, games, and educational products for children.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const rawSearch = typeof params?.search === 'string' ? params.search : undefined;
  const search = rawSearch?.trim() ? rawSearch.trim() : undefined;

  let categories: Category[] = [];
  let products: ProductListItem[] = [];
  let productsError: string | null = null;

  try {
    categories = await getCategories();
  } catch (error) {
    categories = [];
  }

  try {
    products = await getProducts({ include_inactive: false, search });
  } catch (error) {
    products = [];
    productsError = error instanceof Error ? error.message : 'Failed to load products';
  }

  return (
    <div>
      <CategorySection categories={categories} />
      {search && !productsError ? (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
          <p className="text-sm text-cream-600">
            {products.length > 0
              ? `Showing ${products.length} result${products.length !== 1 ? 's' : ''} for "${search}"`
              : `No results for "${search}"`}
            {' — '}
            <a href="/shop" className="text-green-600 hover:text-green-700 font-medium">
              Clear search
            </a>
          </p>
        </div>
      ) : null}
      <FeaturedProducts products={products} error={productsError} />
      <MobileBottomNav />
      <Footer />
    </div>
  );
}
