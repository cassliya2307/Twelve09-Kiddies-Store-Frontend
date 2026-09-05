import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { getHealth } from '@/lib/api';
import type { Metadata } from 'next';

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Checkout - Twelve09 Kiddies Store",
  description: "Complete your purchase securely.",
};

export default async function CheckoutPage() {
  return (
    <div>
      Checkout page content
    </div>
  );
}