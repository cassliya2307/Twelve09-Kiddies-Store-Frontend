'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function Hero() {
  return (
    <section className="relative overflow-hidden py-10 sm:py-12 lg:py-16" style={{ backgroundImage: "url('/Screenshot 2026-09-09 191904.png')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-8 top-0 h-44 w-44 rounded-full bg-green-100 blur-3xl opacity-70" />
        <div className="absolute -right-8 top-12 h-44 w-44 rounded-full bg-orange-100 blur-3xl opacity-70" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(540px,1fr)_minmax(420px,0.95fr)]">
          <div className="absolute left-[45%] top-[20%] z-0 opacity-30 text-2xl" aria-hidden="true">⭐</div>
          <div className="absolute bottom-[30%] left-[52%] z-0 opacity-30 text-[2.5rem]" aria-hidden="true">✨</div>
          <div className="absolute top-[15%] left-[65%] z-0 opacity-20 text-[1.5rem]" aria-hidden="true">⭐</div>
          <div className="absolute bottom-[20%] left-[35%] z-0 opacity-40 text-[2rem]" aria-hidden="true">✨</div>
          <div className="absolute top-[45%] right-[55%] z-0 opacity-20 text-[3rem]" aria-hidden="true">⭐</div>

          <div className="max-w-2xl px-1 sm:px-0">
            <div className="mt-7">
              <h1 className="max-w-[700px] font-black leading-[0.95] tracking-[-0.035em] text-[clamp(2.4rem,11vw,4.5rem)] text-charcoal">
                <span className="block text-[#284d2b]">Everything</span>
                <span className="block text-[#27342b]">your child needs,</span>
                <span className="block text-[#f28b62]">all in one place!</span>
              </h1>
            </div>

            <p className="mt-5 max-w-[620px] text-base font-medium leading-7 text-cream-700 sm:text-lg sm:leading-8">
              Quality • Variety • Care
            </p>

            <div className="mt-8 flex flex-col items-stretch gap-4 sm:flex-row sm:items-start">
              <Link href="/shop" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto rounded-full bg-green-700 px-8 py-3 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-green-900/20 transition hover:bg-green-800">
                  Shop New Arrivals
                </Button>
              </Link>
              <Link href="/shop" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-green-700 px-6 py-3 text-sm font-black uppercase tracking-wide text-green-800 transition hover:bg-green-50 sm:w-auto">
                Shop All
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}