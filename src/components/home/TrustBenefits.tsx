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
        <svg className="h-5 w-5 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6.293-3.293a5.968 5.968 0 010 8.408l-2.827 2.827a3 3 0 01-4.243-4.243l2.827-2.827a5.968 5.968 0 018.408 0z" />
        </svg>
      ),
    },
    {
      id: 2,
      title: 'Wide Variety',
      description: 'For every need',
      icon: (
        <svg className="h-5 w-5 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
    },
    {
      id: 3,
      title: 'Fast Delivery',
      description: 'Across Lagos',
      icon: (
        <svg className="h-5 w-5 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16l-4-4 4-4m0 0l4 4-4 4m0-10v10m-14v2h14v-2M7 32h10a2 2 0 002-2V18h-5v12zm5-15h2m0 4h2m0 4h2m-5-10v10a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
        </svg>
      ),
    },
    {
      id: 4,
      title: 'Safe & Secure',
      description: '100% secure payment',
      icon: (
        <svg className="h-5 w-5 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm0 0v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-12 bg-cream-50 overflow-x-auto scrollbar-hide">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Why Choose Twelve09?
          </h2>
          <p className="text-cream-600 text-sm">
            We're committed to your child's safety and happiness
          </p>
        </div>

        <div className="flex items-center justify-between overflow-x-auto scrollbar-hide">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {benefits.map((benefit) => (
              <article
                key={benefit.id}
                className="group flex-1 flex flex-col items-center text-center rounded-xl bg-white p-5 pb-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-cream-200"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-green-100">
                  {benefit.icon}
                </div>

                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {benefit.title}
                </h3>

                <p className="text-cream-700 text-sm line-clamp-2">
                  {benefit.description}
                </p>
              </article>
            ))}
          </div>

          <div className="hidden sm:block text-cream-600 text-sm">
            All backed by our quality guarantee
          </div>
        </div>
      </div>
    </section>
  );
}