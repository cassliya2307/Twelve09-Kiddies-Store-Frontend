import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ShopContent } from '@/components/shop/ShopContent';
import { getCategories, getProducts, getHealth } from '@/lib/api';
import type { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shop - Twelve09 Kiddies Store",
  description: "Browse our complete collection of toys, games, and educational products for children.",
};

export default async function ShopPage() {
  return (
    <div>
      Shop page content
    </div>
  );
}