'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export function Header() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const { totalItems } = useCart();
  const cartCount = totalItems || 0;
  const showBadge = cartCount > 0;
  const { isAuthenticated, user } = useAuth();

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchInput.trim();
    if (q) {
      router.push(`/shop?search=${encodeURIComponent(q)}`);
    } else {
      router.push('/shop');
    }
  };

  return (
    <div className="sticky top-0 z-50 bg-white/95 border-b border-cream-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2" aria-label="Home">
              <span className="text-xl font-bold text-green-700">Twelve'09</span>
              <span className="text-orange-500 text-sm">Kiddies Store</span>
            </Link>
          </div>

          {/* Search bar in center */}
          <form onSubmit={handleSearch} className="relative flex-1 max-w-md mx-4" role="search" aria-label="Search products">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0m" />
            </svg>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search for products..."
              className="w-full pl-10 pr-12 py-2.5 rounded-full border border-cream-200 placeholder:text-cream-400 focus:ring-green-500 focus:border-green-500 transition-colors"
              aria-label="Search for products"
              autoComplete="off"
            />
            <Button type="submit" size="sm" variant="outline" className="absolute right-2.5 top-1/2 -translate-y-1/2" aria-label="Search">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
              </svg>
            </Button>
          </form>

          {/* Right actions: Track Order → Cart → Login */}
          <div className="flex items-center gap-3">
            <Link
              href="/orders"
              className="text-cream-600 hover:text-green-600 transition-colors text-sm font-medium"
              aria-label="Track Order"
            >
              Track Order
            </Link>

            <Link
              href="/cart"
              className="relative text-cream-600 hover:text-green-600 transition-colors"
              aria-label="Cart"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {showBadge && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <span className="text-cream-600 text-sm">
                Welcome, {user?.name ? user.name.charAt(0).toUpperCase() + '.' : ''}
              </span>
            ) : (
              <Link
                href="/login?mode=login&redirect=/"
                className="text-cream-600 hover:text-green-600 transition-colors text-sm font-medium"
                aria-label="Login"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}