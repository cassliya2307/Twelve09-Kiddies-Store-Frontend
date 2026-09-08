'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-cream-50 py-16 sm:py-24 lg:py-32">
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-20 -left-20 w-48 h-48 rounded-full bg-green-100/20 blur-xl" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 rounded-full bg-green-100/20 blur-xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-green-100/10 blur-xl" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Free delivery on orders over ₦50,000
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
              <span className="text-green-600">EVERYTHING</span>
              <span className="text-gray-900"> YOUR CHILD NEEDS,</span>
              <span className="text-pink-600">ALL IN ONE PLACE!</span>
            </h1>
            <p className="text-lg text-cream-700 mb-8 max-w-xl">
              Quality · Variety · Care
              <svg className="inline-block align-middle text-green-500 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/shop">
                <Button size="lg" className="w-full sm:w-auto bg-green-600 text-white hover:bg-green-500">
                  Shop Now
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative pt-8">
            <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-cream-100 min-h-[400px]" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} aria-hidden="true">
              <div className="absolute -top-10 -left-10 w-20 h-20 rounded-full bg-green-200/30 blur-xl" />
              <div className="absolute bottom-10 right-10 w-24 h-24 rounded-full bg-purple-200/30 blur-xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}