import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { getCategories, getProducts } from '@/lib/api';
import type { Category, ProductListItem } from '@/types/api';
import type { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Category - Twelve09 Kiddies Store",
  description: "Shop by category",
};

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const categoryId = parseInt(id, 10)

  if (isNaN(categoryId)) {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-cream-50 font-sans antialiased flex flex-col">
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white">
            Skip to main content
          </a>
          <main id="main-content" className="flex-1">
            <div className="bg-white py-8 sm:py-12">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="border-b border-cream-200 pb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Invalid category</h2>
                </div>
                <div className="mt-6 text-center">
                  <p className="text-red-600">Invalid category ID.</p>
                  <Link href="/shop" className="mt-4 inline-block text-green-600 hover:text-green-700 font-medium">
                    Browse All Products
                  </Link>
                </div>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  let category: Category | undefined;
  let products: ProductListItem[] = [];
  let error: string | null = null;

  try {
    const categories = await getCategories();
    category = categories.find((c) => c.id === categoryId);

    if (category) {
      const allProducts = await getProducts({ include_inactive: false });
      products = allProducts.filter((p) => p.category_id === category!.id && p.is_active);
    } else {
      error = 'Category not found';
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load category';
  }

  if (error) {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-cream-50 font-sans antialiased flex flex-col">
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white">
            Skip to main content
          </a>
          <main id="main-content" className="flex-1">
            <div className="bg-white py-8 sm:py-12">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="border-b border-cream-200 pb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Error</h2>
                </div>
                <div className="mt-6 text-center">
                  <p className="text-red-600">{error}</p>
                  <Link href="/shop" className="mt-4 inline-block text-green-600 hover:text-green-700 font-medium">
                    Browse All Products
                  </Link>
                </div>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  const itemLabel = products.length !== 1 ? 'items' : 'item';

  if (products.length === 0) {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-cream-50 font-sans antialiased flex flex-col">
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white">
            Skip to main content
          </a>
          <main id="main-content" className="flex-1">
            <div className="bg-white py-8 sm:py-12">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="border-b border-cream-200 pb-6">
                  <h2 className="text-2xl font-bold text-gray-900">No Products Available</h2>
                </div>
                <div className="mt-6 text-center">
                  <p className="text-cream-600">There are no active products in this category.</p>
                  <Link href="/shop" className="mt-4 inline-block text-green-600 hover:text-green-700 font-medium">
                    Browse All Products
                  </Link>
                </div>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-cream-50 font-sans antialiased flex flex-col">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white">
          Skip to main content
        </a>

        <main id="main-content" className="flex-1">
          <div className="bg-white py-8 sm:py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="border-b border-cream-200 pb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {category!.name}
                </h2>
              </div>

              <div className="mt-6">
                <p className="text-cream-600">
                  {products.length} {itemLabel}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="border rounded-xl p-4 hover:bg-cream-50 transition-colors"
                  >
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-40 object-cover rounded-t-xl mb-3"
                      />
                    )}
                    <h3 className="font-medium text-gray-900 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-cream-600 text-sm line-clamp-2">
                      {product.description || ''}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-green-600 font-medium">{product.price}</span>
                      <span className="text-cream-500 text-xs">
                        {product.stock_quantity} in stock
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
