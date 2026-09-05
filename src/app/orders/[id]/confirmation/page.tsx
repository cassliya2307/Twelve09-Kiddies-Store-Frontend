import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { OrderConfirmationContent } from './OrderConfirmationContent';
import { getCategories, getHealth } from '@/lib/api';

export const revalidate = 0;

async function getConfirmationPageData() {
  const [categoriesResult, healthResult] = await Promise.allSettled([
    getCategories(),
    getHealth(),
  ]);

  return {
    categoriesError: categoriesResult.status === 'rejected' ? categoriesResult.reason.message : null,
    isHealthy: healthResult.status === 'fulfilled',
  };
}

export default async function OrderConfirmationPage() {
  const { categoriesError, isHealthy } = await getConfirmationPageData();

  return (
    <html lang="en">
      <head>
        <title>Order Confirmation - Twelve09 Kiddies Store</title>
        <meta name="description" content="Your order has been confirmed. View order details and track delivery." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-screen bg-cream-50 font-sans antialiased flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white"
        >
          Skip to main content
        </a>

        <Header />

        <main id="main-content" className="flex-1">
          {categoriesError && (
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4" role="alert">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800">Unable to load categories. Some features may not work correctly.</p>
              </div>
            </div>
          )}

          <OrderConfirmationContent />
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
      </body>
    </html>
  );
}