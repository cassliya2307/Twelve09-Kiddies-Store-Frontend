import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ProductDetails } from '@/components/product/ProductDetails';
import { ProductDetailsSkeleton } from '@/components/ui/Skeleton';
import { getProduct, getCategories, getHealth } from '@/lib/api';
import type { Category, Product } from '@/types/api';
import { Metadata } from 'next';

export const revalidate = 60;

interface ProductPageData {
  product: Product | null;
  category: Category | null;
  categories: Category[];
  productError: string | null;
  isHealthy: boolean;
}

async function getProductPageData(id: string): Promise<ProductPageData> {
  const productId = parseInt(id, 10);

  if (isNaN(productId)) {
    return {
      product: null,
      category: null,
      categories: [],
      productError: 'Invalid product ID',
      isHealthy: false,
    };
  }

  const [productResult, categoriesResult, healthResult] = await Promise.allSettled([
    getProduct(productId),
    getCategories(),
    getHealth(),
  ]);

  const product = productResult.status === 'fulfilled' ? productResult.value : null;
  const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];
  const category = product?.category_id
    ? categories.find((c) => c.id === product.category_id) || null
    : null;

  return {
    product,
    category,
    categories,
    productError: productResult.status === 'rejected' ? productResult.reason.message : product ? null : 'Product not found',
    isHealthy: healthResult.status === 'fulfilled',
  };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const productId = parseInt(id, 10);

  if (isNaN(productId)) {
    return {
      title: 'Product Not Found',
    };
  }

  try {
    const product = await getProduct(productId);
    return {
      title: product.name,
      description: product.description?.slice(0, 160) || `View ${product.name} at Twelve09 Kiddies Store`,
      openGraph: {
        title: product.name,
        description: product.description?.slice(0, 160) || `View ${product.name} at Twelve09 Kiddies Store`,
        type: 'website',
        images: product.image_url ? [product.image_url] : [],
      },
    };
  } catch {
    return {
      title: 'Product Not Found',
    };
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { product, category, productError, isHealthy } = await getProductPageData(id);

  return (
    <div className="min-h-screen bg-cream-50 font-sans antialiased flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white"
      >
        Skip to main content
      </a>

      <Header />

      <main id="main-content" className="flex-1">
        {productError && !product && (
          <section className="bg-white border-b border-cream-200 py-16 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
              <svg className="mx-auto h-16 w-16 text-cream-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h1 className="mt-6 text-2xl sm:text-3xl font-bold text-gray-900">Product Not Found</h1>
              <p className="mt-3 text-cream-600 max-w-md mx-auto">
                {productError === 'Invalid product ID'
                  ? 'The product you\'re looking for doesn\'t exist or the link is invalid.'
                  : 'The product you\'re looking for doesn\'t exist or has been removed.'}
              </p>
              <Link
                href="/shop"
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Shop
              </Link>
            </div>
          </section>
        )}

        {product && (
          <section className="bg-white border-b border-cream-200 py-8 sm:py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <ProductDetails product={product} category={category} />
            </div>
          </section>
        )}

        {!productError && !product && (
          <section className="bg-white border-b border-cream-200 py-16 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <ProductDetailsSkeleton />
            </div>
          </section>
        )}
      </main>

      <Footer />

      <MobileBottomNav />

      {!isHealthy && (
        <div
          className="fixed bottom-20 md:bottom-4 right-4 left-4 md:right-4 md:left-auto z-50 animate-slide-up"
          role="alert"
          aria-live="polite"
        >
          <div className="mx-auto max-w-md bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Backend connection issue</p>
                <p className="mt-1 text-sm text-red-700">
                  Some features may not work correctly. Please try again later.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}