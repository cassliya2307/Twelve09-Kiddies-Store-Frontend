'use client';

import Link from 'next/link';

interface Category {
  id: number;
  name: string;
  description: string | null;
  is_active?: boolean;
  pastelColor?: string;
}

const categoryPastelColors = [
  '#E3F2FD',
  '#FFE8F0',
  '#E8F5E9',
  '#FFF3E0',
  '#F3E5F5',
];

const categoryIcons: Record<string, React.ReactNode> = {
  School: (
    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  Baby: (
    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  Fashion: (
    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  Party: (
    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Default: (
    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2M9 19l12-3" />
    </svg>
  ),
};

function getCategoryIcon(name: string) {
  const key = Object.keys(categoryIcons).find((k) => name.includes(k));
  return key ? categoryIcons[key] : categoryIcons.Default;
}

export function CategorySection({ categories }: { categories: Category[] }) {
  const activeCategories = (categories || []).filter((c) => c.is_active !== false);
  if (!activeCategories || activeCategories.length === 0) {
    return (
      <section className="py-6 bg-cream-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <p className="text-cream-600">No categories available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 bg-cream-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {activeCategories.slice(0, 5).map((category, index) => {
            const color = category.pastelColor || categoryPastelColors[index % categoryPastelColors.length];
            return (
              <Link
                key={category.id}
                href={`/categories/${category.id}`}
                className="group flex flex-col items-center py-4 px-3 rounded-xl border border-transparent hover:border-opacity-50 hover:bg-opacity-100 transition-colors duration-200"
                style={{ backgroundColor: color }}
              >
                <div className="w-10 h-10 rounded-xl mb-2 flex items-center justify-center" style={{ backgroundColor: color }}>
                  {getCategoryIcon(category.name)}
                </div>
                <h3 className="text-xs font-medium text-gray-700 capitalize">{category.name}</h3>
                {category.description && (
                  <p className="text-xs text-cream-600 line-clamp-2 mt-1">{category.description}</p>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

