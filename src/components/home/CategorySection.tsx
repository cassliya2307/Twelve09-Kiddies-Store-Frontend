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
    label: 'Back to School Essentials',
    href: '/shop',
    color: '#dff2ff',
    icon: <BackpackIcon />,
  },
  {
    title: 'Baby essentials',
    label: 'Educational & Fun Toys',
    href: '/shop',
    color: '#ffe6ee',
    icon: <BlocksIcon />,
  },
  {
    title: 'Toys & games',
    label: 'Party Packs & Souvenirs',
    href: '/shop',
    color: '#ddf8d9',
    icon: <GiftIcon />,
  },
  {
    title: 'Kids fashion',
    label: 'Kids Fashion',
    href: '/shop',
    color: '#ffeacd',
    icon: <TshirtIcon />,
  },
  {
    title: 'Party packs',
    label: 'Daily Essentials',
    href: '/shop',
    color: '#eae2ff',
    icon: <ShoppingBagIcon />,
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

function BlocksIcon() {
  return (
    <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 4.5h7v7h-7zM13.5 4.5h7v7h-7zM3.5 14.5h7v5h-7zM13.5 14.5h7v5h-7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M17 7h.01M7 16.5h.01M17 16.5h.01" />
    </svg>
  );
}

function TshirtIcon() {
  return (
    <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 4 4.5 5.5 2.5 11l3.5 2 2-3v10h12V10l2 3 3.5-2-2-5.5L18 4l-3 2h-4L8 4z" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h16v11H4zM3 7h18v3H3zM12 7v14" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7H8.5a2.5 2.5 0 1 1 2.5-2.5V7Zm0 0h3.5a2.5 2.5 0 1 0-2.5-2.5V7Z" />
    </svg>
  );
}

function ShoppingBagIcon() {
  return (
    <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14l1 13H4L5 8Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8V6a3 3 0 0 1 6 0v2M9 13h6" />
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

