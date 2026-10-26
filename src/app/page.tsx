import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Hero } from '@/components/home/Hero';
import { CategorySection } from '@/components/home/CategorySection';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { TrustBenefits } from '@/components/home/TrustBenefits';
import { getCategories, getProducts } from '@/lib/api';
import type { Metadata } from 'next';
import type { Category, ProductListItem } from '@/types/api';

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Everything Little Ones Love, All in One Place.",
  description: "Shop Back to School Essentials, Educational & Fun Toys, Party Packs & Souvenirs, Kids Fashion, and Daily Essentials.",
};

export default async function Home() {
  let categories: Category[] = [];
  let products: ProductListItem[] = [];
  let productsError: string | null = null;

  try {
    categories = await getCategories();
  } catch (error) {
    categories = [];
  }

  try {
    products = await getProducts();
  } catch (error) {
    products = [];
    productsError = error instanceof Error ? error.message : 'Failed to load products';
  }

  return (
    <div>
      <Hero />
      <CategorySection categories={categories} />
      <FeaturedProducts products={products} error={productsError} />
      <TrustBenefits />
      <MobileBottomNav />
      <Footer />
    </div>
  );
}