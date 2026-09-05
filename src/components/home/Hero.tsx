'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-cream-50 py-16 sm:py-24 lg:py-32">
      {/* Decorative subtle line-art elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-48 h-48 rounded-full bg-green-100/20 blur-xl" aria-hidden="true" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 rounded-full bg-green-100/20 blur-xl" aria-hidden="true" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-green-100/10 blur-xl" aria-hidden="true" />
        <path className="absolute -inset-2 rounded-full stroke-green-100 stroke-1 opacity-20" d="M0 0h24v24H0z" fill="none" />
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
              EVERYTHING YOUR CHILD NEEDS,
              <span className="text-green-600">ALL IN ONE PLACE!</span>
            </h1>

            <p className="text-lg text-cream-700 mb-8 max-w-xl">
              Quality · Variety · Care
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/shop">
                <Button size="lg" className="w-full sm:w-auto">
                  Shop Now
                </Button>
              </Link>
              <Link href="/categories">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Browse Categories
                </Button>
              </Link>
            </div>
          </div>

          {/* Children's image section */}
          <div className="relative pt-8">
            <Image
              src="/placeholder-child-hero.jpg"
              alt="Happy child playing with toys"
              className="relative aspect-[4/5] rounded-lg overflow-hidden bg-cream-100"
              width={600}
              height={750}
              loading="lazy"
              style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
            />
            {/* Optional: add a playful caption below on mobile */}
            <p className="mt-4 text-center text-sm text-cream-600">
              Discover toys that spark joy and learning
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}