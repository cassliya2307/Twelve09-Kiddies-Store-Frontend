import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Hero } from '@/components/home/Hero';
import { CategorySection } from '@/components/home/CategorySection';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { TrustBenefits } from '@/components/home/TrustBenefits';
import { getCategories, getProducts, getHealth } from '@/lib/api';
import type { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Twelve09 Kiddies Store - Toys, Games & Educational Products for Children",
  description: "Discover joy in every toy! Shop our curated collection of educational toys, creative games, and delightful surprises for children of all ages.",
};

import type { Category, ProductListItem } from '@/types/api';

export default async function Home() {
  let categories: Category[] = [];
  let products: ProductListItem[] = [];

  try {
    categories = await getCategories();
  } catch (error) {
    categories = [];
  }

  try {
    products = await getProducts();
  } catch (error) {
    products = [];
  }

  return (
    <div>
      <Header />
      <Hero />
      <CategorySection categories={categories} />
      <FeaturedProducts products={products} />
      <TrustBenefits />
      <MobileBottomNav />
      <Footer />
    </div>
  );
}