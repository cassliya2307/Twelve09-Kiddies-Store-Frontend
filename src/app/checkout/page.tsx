import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { CheckoutContent } from './CheckoutContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Checkout - Twelve09 Kiddies Store",
  description: "Complete your purchase securely.",
};

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-cream-50">
        <Suspense fallback={<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center text-cream-600">Loading checkout...</div>}>
          <CheckoutContent initialAddresses={[]} />
        </Suspense>
      </main>
      <Footer />
      <MobileBottomNav />
    </>
  );
}

