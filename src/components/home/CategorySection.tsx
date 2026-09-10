'use client';

import Link from 'next/link';

interface Category {
  id: number;
  name: string;
  description: string | null;
  is_active?: boolean;
  pastelColor?: string;
}

const categoryCards = [
  {
    title: 'Back to school',
    label: 'Back to school',
    href: '/shop',
    color: '#dff2ff',
    icon: <BackpackIcon />,
  },
  {
    title: 'Baby essentials',
    label: 'Baby essentials',
    href: '/shop',
    color: '#ffe6ee',
    icon: <BabyIcon />,
  },
  {
    title: 'Toys & games',
    label: 'Toys & games',
    href: '/shop',
    color: '#ddf8d9',
    icon: <TeddyIcon />,
  },
  {
    title: 'Kids fashion',
    label: 'Kids fashion',
    href: '/shop',
    color: '#ffeacd',
    icon: <TshirtIcon />,
  },
  {
    title: 'Party packs',
    label: 'Party packs',
    href: '/shop',
    color: '#eae2ff',
    icon: <GiftIcon />,
  },
];

function BackpackIcon() {
  return (
    <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V6a4 4 0 0 1 8 0v1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 8h12l-1 11a2 2 0 0 1-2 1.7H9a2 2 0 0 1-2-1.7L6 8z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 11h6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 16h4" />
    </svg>
  );
}

function BabyIcon() {
  return (
    <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 3h4v4h-4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6l1 6a4 4 0 0 1-8 0l1-6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 13c-2.2 1.5-3 3.3-2 5.5C8 20 9.8 20.5 11 19" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13c2.2 1.5 3 3.3 2 5.5C14 20 12.2 20.5 11 19" />
    </svg>
  );
}

function TeddyIcon() {
  return (
    <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 11c0-3 2-5.8 5-5.8 1 0 2.2.6 3 1.6.8-1 2-1.6 3-1.6 3 0 5 2.8 5 5.8 0 3.2-2 5.8-5 5.8H9c-3 0-5-2.6-5-5.8z" />
      <circle cx="9" cy="8" r="1" />
      <circle cx="15" cy="8" r="1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 11c.7 1.2 3.3 1.2 4 0" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16c1.5 1.4 4.2 1.4 5.6 0" />
    </svg>
  );
}

function TshirtIcon() {
  return (
    <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8l3-3 4 2 4-2 4 3 2 7-4 3-3-4-4 4-4-4-3 4-4-3 2-7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 17l4 4 4-4" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h16v12H4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v12" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 14h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10s-3-5-3-7 2-2 3-1 3 2 3 3-2 5-3 5z" />
    </svg>
  );
}

export function CategorySection({ categories }: { categories: Category[] }) {
  return (
    <section className="bg-white py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-green-800">Shop by age & play</span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-charcoal sm:text-4xl">Explore Our Collections</h2>
          </div>
          <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide text-green-800 transition hover:text-green-700">
            View all categories
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-5">
          {categoryCards.map((category, index) => (
            <Link
              key={category.title}
              href={category.href}
              className="group flex min-h-[160px] flex-col items-center justify-center rounded-[16px] border border-cream-200 p-5 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:scale-[1.05] hover:shadow-[var(--shadow-soft)]"
              style={{ backgroundColor: category.color }}
            >
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-green-800 shadow-sm transition duration-300 group-hover:bg-green-800 group-hover:text-white">
                {category.icon}
              </span>
              <span className="text-sm font-black capitalize tracking-wide text-charcoal">
                {category.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

