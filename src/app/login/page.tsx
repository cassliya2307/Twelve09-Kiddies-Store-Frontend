import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { getHealth } from '@/lib/api';
import type { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Sign In - Twelve09 Kiddies Store",
  description: "Sign in to your Twelve09 Kiddies Store account.",
};

export default async function LoginPage() {
  return (
    <div>
      Sign in page content
    </div>
  );
}