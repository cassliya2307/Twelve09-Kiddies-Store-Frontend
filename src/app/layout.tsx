import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { Header } from '@/components/layout/Header';
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  title: {
    default: "Twelve’09 Kiddies Store - Toys, Games & Educational Products for Children",
    template: "%s | Twelve’09 Kiddies Store",
  },
  description: "Discover joy in every toy! Shop our curated collection of educational toys, creative games, and delightful surprises for children of all ages.",
  keywords: ["toys", "games", "educational toys", "children", "kids store", "nigeria", "online shopping"],
  authors: [{ name: "Twelve’09 Kiddies Store" }],
  creator: "Twelve’09 Kiddies Store",
  publisher: "Twelve’09 Kiddies Store",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://twelve09kiddiesstore.com",
    siteName: "Twelve’09 Kiddies Store",
    title: "Twelve’09 Kiddies Store - Toys, Games & Educational Products for Children",
    description: "Discover joy in every toy! Shop our curated collection of educational toys, creative games, and delightful surprises for children of all ages.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Twelve’09 Kiddies Store",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Twelve’09 Kiddies Store",
    description: "Discover joy in every toy! Shop our curated collection of educational toys, creative games, and delightful surprises for children of all ages.",
    images: ["/og-image.jpg"],
  },
  verification: {
    google: "google-site-verification-code",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fefdf8" },
    { media: "(prefers-color-scheme: dark)", color: "#1f1f1f" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.twelve09kiddiesstore.com" />
      </head>
      <body className="min-h-full flex flex-col bg-cream-50 text-gray-900">
        <AuthProvider>
          <CartProvider>
            <Header />
            <main>{children}</main>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}