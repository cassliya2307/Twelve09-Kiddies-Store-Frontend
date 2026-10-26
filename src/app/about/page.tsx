import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import type { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: "About Us - Twelve'09 Kiddies Store",
  description: "Learn more about Twelve'09 Kiddies Store and what we offer.",
};

export default function AboutPage() {
  return (
    <div>
      <div className="min-h-screen bg-cream-50 font-sans antialiased flex flex-col">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white">
          Skip to main content
        </a>

        <main id="main-content" className="flex-1">
          <div className="bg-white py-8 sm:py-12">
            <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
              <div className="border-b border-cream-200 pb-6">
                <h2 className="text-2xl font-bold text-gray-900">About Us</h2>
              </div>

              <div className="mt-6 space-y-4">
                <p className="text-cream-600 text-lg font-bold">
                  A One Stop-Shop for your Little Ones…
                </p>

                <p className="text-cream-600 text-lg">
                  Back to School Essentials, Educational &amp; Fun Toys, Party Packs &amp; Souvenirs, Kids Fashion, and Daily Essentials.
                </p>

                <p className="text-cream-600 text-lg font-bold">
                  Everything Little Ones Love, All in One Place.
                </p>

                <p className="text-cream-600 text-lg">
                  Contact us at <a href="mailto:twelve09kiddiesstore@gmail.com" className="text-green-600 hover:text-green-700 transition-colors" aria-label="Email Twelve'09 Kiddies Store">
                    twelve09kiddiesstore@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </main>

        <Footer />

        <MobileBottomNav />
      </div>
    </div>
  );
}