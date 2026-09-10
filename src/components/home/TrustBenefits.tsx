'use client';

import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

interface TrustBenefit {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function TrustBenefits({ isLoading }: { isLoading?: boolean }) {
  if (isLoading) {
    return (
      <section className="py-8 bg-cream-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton className="h-20 rounded-lg bg-cream-100" key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const benefits: TrustBenefit[] = [
    {
      id: 1,
      title: 'Quality Products',
      description: 'Carefully selected',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6.293-3.293a5.968 5.968 0 010 8.408l-2.827 2.827a3 3 0 01-4.243-4.243l2.827-2.827a5.968 5.968 0 018.408 0z" />
        </svg>
      ),
    },
    {
      id: 2,
      title: 'Wide Variety',
      description: 'For every need',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
    },
    {
      id: 3,
      title: 'Fast Delivery',
      description: 'Across Lagos',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h12l3 3h4a2 2 0 012 2v5a2 2 0 01-2 2H8a2 2 0 01-2-2V7zM7 19h.01M17 19h.01" />
        </svg>
      ),
    },
    {
      id: 4,
      title: 'Safe & Secure',
      description: '100% secure payment',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm0 0v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="bg-white py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-green-800">Our promise</span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-charcoal sm:text-4xl">Why Choose Twelve’09?</h2>
          </div>
          <p className="max-w-md text-sm font-bold text-cream-700">We’re committed to quality play, thoughtful discovery, and happy family shopping.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <article
              key={benefit.id}
              className="group flex min-h-[180px] flex-col items-center justify-center rounded-[1.75rem] border border-cream-200 bg-cream-50 p-6 text-center transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
            >
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-800 shadow-sm transition group-hover:bg-green-700 group-hover:text-white">
                {benefit.icon}
              </span>
              <h3 className="text-lg font-black tracking-tight text-charcoal">{benefit.title}</h3>
              <p className="mt-2 text-sm font-medium text-cream-700">{benefit.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}