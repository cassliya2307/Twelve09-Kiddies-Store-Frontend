import { Suspense } from 'react';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { LoginContent } from './LoginContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Sign In - Twelve09 Kiddies Store",
  description: "Sign in to your Twelve09 Kiddies Store account.",
};

export default function LoginPage() {
  return (
    <>
      <main id="main-content">
        <Suspense fallback={<div className="mx-auto max-w-md px-4 py-16 sm:py-24 text-center text-cream-600">Loading...</div>}>
          <LoginContent />
        </Suspense>
      </main>
      <Footer />
      <MobileBottomNav />
    </>
  );
}
