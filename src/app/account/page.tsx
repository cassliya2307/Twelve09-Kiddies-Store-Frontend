'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/Header';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

export default function AccountPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/account');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton variant="text" width="40%" height="32px" className="mb-6" />
          <div className="bg-white rounded-2xl border border-cream-200 p-6 sm:p-8 space-y-5">
            <Skeleton variant="circular" className="w-16 h-16" />
            <Skeleton variant="text" width="50%" />
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
        <MobileBottomNav />
      </>
    );
  }

  if (!user) return null;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
        <p className="mt-1 text-cream-600">Manage your details and review your orders.</p>

        {/* Account navigation */}
        <nav className="mt-6 flex flex-wrap gap-3" aria-label="Account navigation">
          <Link
            href="/account"
            aria-current="page"
            className="px-4 py-2 rounded-xl text-sm font-medium bg-green-100 text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Account
          </Link>
          <Link
            href="/orders"
            className="px-4 py-2 rounded-xl text-sm font-medium border border-cream-200 text-gray-700 hover:bg-cream-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            My Orders
          </Link>
          <Link
            href="/account/addresses"
            className="px-4 py-2 rounded-xl text-sm font-medium border border-cream-200 text-gray-700 hover:bg-cream-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Addresses
          </Link>
          <Link
            href="/shop"
            className="px-4 py-2 rounded-xl text-sm font-medium border border-cream-200 text-gray-700 hover:bg-cream-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Shop
          </Link>
        </nav>

        {/* Account header */}
        <section className="mt-6 bg-white rounded-2xl border border-cream-200 p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700 text-2xl font-bold"
              aria-hidden="true"
            >
              {user.name ? user.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-cream-600">{user.email}</p>
              <div className="mt-2">
                <Badge variant={user.is_active ? 'success' : 'warning'} size="sm">
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-cream-200 p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700" aria-hidden="true">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900">Orders</h2>
            </div>
            <p className="text-sm text-cream-600 flex-1">View your order history and track purchases.</p>
            <Link href="/orders" className="mt-4">
              <Button variant="outline" size="md" className="w-full">
                View My Orders
              </Button>
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-cream-200 p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700" aria-hidden="true">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900">Addresses</h2>
            </div>
            <p className="text-sm text-cream-600 flex-1">Manage your saved delivery addresses.</p>
            <Link href="/account/addresses" className="mt-4">
              <Button variant="outline" size="md" className="w-full">
                Manage Addresses
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <MobileBottomNav />
    </>
  );
}
