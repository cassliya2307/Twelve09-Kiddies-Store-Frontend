import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import type { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Contact - Twelve09 Kiddies Store",
  description: "Contact Twelve09 Kiddies Store for inquiries and support.",
};

export default function ContactPage() {
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
                <h2 className="text-2xl font-bold text-gray-900">Contact Us</h2>
              </div>

              <div className="mt-6 space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Location</h3>
                  <p className="text-cream-600">
                    Malvin Mall, 25A Admiralty Road,<br />
                    Lekki Phase 1, Lagos, Nigeria
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Phone</h3>
                  <div className="flex items-center gap-2 text-cream-600">
                    <a href="tel:07066260514" className="text-green-600 hover:text-green-700 transition-colors" aria-label="Call 07066260514">07066260514</a>
                    <a href="tel:09136275912" className="text-green-600 hover:text-green-700 transition-colors" aria-label="Call 09136275912">09136275912</a>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Email</h3>
                  <p className="text-cream-600">
                    <a href="mailto:twelve09kiddiesstore@gmail.com" className="text-green-600 hover:text-green-700 transition-colors" aria-label="Email Twelve09">
                      twelve09kiddiesstore@gmail.com
                    </a>
                  </p>
                </div>
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