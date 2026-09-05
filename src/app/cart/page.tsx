import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { CartContent } from '@/components/cart/CartContent';
import { getCategories, getHealth } from '@/lib/api';
import type { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shopping Cart - Twelve09 Kiddies Store",
  description: "Review your cart and proceed to checkout.",
};

export default async function CartPage() {
  return (
    <div>
      Cart page content
    </div>
  );
}

async function getCartPageData() {
  return { categories: [], categoriesError: null, isHealthy: true };
}