'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export function Header() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/shop', label: 'Shop' },
    { href: '/categories', label: 'Categories' },
    { href: '/deals', label: 'Deals' },
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-cream-200/80 bg-cream-50/95 backdrop-blur">
      <div className="flex flex-col">
        <div className="flex w-full items-center justify-between gap-2 px-3 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 shrink-0 items-center">
            <Link href="/" className="flex items-center gap-3" aria-label="Twelve’09 Kiddies Store Home">
              <span className="flex items-center justify-center">
                <img
                  src="/twelve09-logo-removebg-preview.png"
                  alt="Twelve’09 Kiddies Store"
                  className="h-[52px] w-[150px] object-contain sm:h-[58px] sm:w-[170px] md:h-[68px] md:w-[220px] lg:h-[70px] lg:w-[310px]"
                />
              </span>
            </Link>
          </div>

          <form onSubmit={handleSearch} className="relative hidden w-[40%] md:block" role="search" aria-label="Search products">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cream-600 pointer-events-none w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search for products..."
              className="w-full rounded-full border border-cream-300 bg-white py-2.5 pl-11 pr-12 placeholder:text-cream-600 shadow-sm transition-all focus:border-transparent focus:ring-2 focus:ring-green-500"
              aria-label="Search for products"
              autoComplete="off"
            />
            <Button type="submit" size="sm" variant="outline" className="absolute right-2 top-1/2 h-8 -translate-y-1/2 rounded-full px-3 py-2" aria-label="Search">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            </Button>
          </form>

          <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3 md:gap-5">
            <Link href="/track-order" className="hidden text-sm font-bold text-gray-700 transition-colors hover:text-green-800 md:inline-flex" aria-label="Track Order">
              Track Order
            </Link>

            <Link href="/cart" className="group relative inline-flex items-center gap-2 rounded-full px-2 py-2 text-sm font-bold text-green-800 transition-colors duration-200 hover:bg-green-50 hover:text-green-700 sm:px-3" aria-label="Cart">
              <span className="inline-flex items-center gap-2">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
                <span className="hidden sm:inline">Cart</span>
              </span>
              {showBadge && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[11px] font-bold text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <Link href="/profile" className="hidden items-center gap-1 text-sm font-bold text-green-800 transition-colors hover:text-green-600 sm:inline-flex">
                <span>Welcome, {user?.name ? user.name.split(' ')[0] : 'User'}</span>
              </Link>
            ) : (
              <Link href="/login?mode=login&redirect=/" className="hidden items-center gap-2 text-sm font-bold text-green-800 transition-colors hover:text-green-600 md:inline-flex" aria-label="Login">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                <span>Login</span>
              </Link>
            )}

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-cream-300 bg-white text-green-800 shadow-sm md:hidden"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((value) => !value)}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        <nav className="hidden items-center justify-center gap-10 border-t border-[#eaeaea] px-4 py-[10px] md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-bold text-charcoal no-underline transition-all duration-200 hover:font-black hover:text-green-800">
              {link.label}
            </Link>
          ))}
        </nav>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-cream-200 bg-cream-50">
            <div className="px-4 py-4">
              <form onSubmit={handleSearch} className="relative" role="search" aria-label="Search products">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cream-600 pointer-events-none w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search products"
                  className="w-full rounded-full border border-cream-300 bg-white py-2.5 pl-11 pr-4 placeholder:text-cream-600 shadow-sm focus:border-transparent focus:ring-2 focus:ring-green-500"
                  aria-label="Search for products"
                  autoComplete="off"
                />
              </form>
              <nav className="mt-4 flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="rounded-xl px-3 py-3 text-sm font-bold text-charcoal hover:bg-green-50 hover:text-green-800" onClick={() => setMobileMenuOpen(false)}>
                    {link.label}
                  </Link>
                ))}
                <Link href="/track-order" className="rounded-xl px-3 py-3 text-sm font-bold text-gray-700 hover:bg-green-50 hover:text-green-800" onClick={() => setMobileMenuOpen(false)}>
                  Track Order
                </Link>
                {isAuthenticated ? (
                  <Link href="/profile" className="rounded-xl px-3 py-3 text-sm font-bold text-green-800 hover:bg-green-50" onClick={() => setMobileMenuOpen(false)}>
                    Welcome, {user?.name ? user.name.split(' ')[0] : 'User'}
                  </Link>
                ) : (
                  <Link href="/login?mode=login&redirect=/" className="rounded-xl px-3 py-3 text-sm font-bold text-green-800 hover:bg-green-50" onClick={() => setMobileMenuOpen(false)}>
                    Login
                  </Link>
                )}
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}