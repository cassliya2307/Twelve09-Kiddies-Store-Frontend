'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const cartCount = totalItems || 0;
  const showBadge = cartCount > 0;

  return (
    <div className="sticky top-0 z-50 bg-white/95 border-b border-cream-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2" aria-label="Home">
              <span className="text-xl font-bold text-gray-900">Twelve09</span>
            </Link>
          </div>

          <div>
            <Link href="/cart" className="relative text-gray-600 hover:text-green-600 transition-colors" aria-label="Cart">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {showBadge && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
            <Link href="/account" className="ml-4 text-sm font-medium text-gray-700 hover:text-green-600">
              Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}