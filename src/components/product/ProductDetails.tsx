'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ProductImage } from '@/components/ui/ProductImage';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProductQuantitySelector } from '@/components/product/ProductQuantitySelector';
import { ProductReviews } from '@/components/ProductReviews';
import { useCart } from '@/context/CartContext';
import type { Product } from '@/types/api';

interface ProductDetailsProps {
  product: Product;
  category?: { id: number; name: string } | null;
}

export function ProductDetails({ product, category }: ProductDetailsProps) {
  const { addToCart, getCartQuantity } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const price = Number(product.price).toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const isOutOfStock = product.stock_quantity === 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;
  const isUnavailable = !product.is_active || isOutOfStock;

  const inCartQuantity = getCartQuantity(product.id);
  const isInCartResult = inCartQuantity > 0;

  const handleAddToCart = () => {
    if (isUnavailable) return;
    addToCart(product, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  const stockStatus = isOutOfStock
    ? { label: 'Out of Stock', variant: 'danger' as const }
    : isLowStock
    ? { label: `Only ${product.stock_quantity} left`, variant: 'warning' as const }
    : { label: 'In Stock', variant: 'success' as const };

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="space-y-4">
          <div className="relative aspect-[4/5] rounded-2xl bg-cream-50 overflow-hidden">
            <ProductImage
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {!product.is_active && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Badge variant="danger" size="lg">Unavailable</Badge>
              </div>
            )}
          </div>

          {product.image_url && (
            <div className="grid grid-cols-2 gap-4" aria-hidden="true">
              <div className="relative aspect-square rounded-xl bg-cream-50 overflow-hidden">
                <ProductImage
                  src={product.image_url}
                  alt=""
                  className="w-full h-full object-cover opacity-50"
                />
              </div>
              <div className="relative aspect-square rounded-xl bg-cream-50 overflow-hidden">
                <ProductImage
                  src={product.image_url}
                  alt=""
                  className="w-full h-full object-cover opacity-50"
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-sm">
            <Link href="/" className="text-cream-500 hover:text-green-600 transition-colors">Home</Link>
            <span className="text-cream-300" aria-hidden="true">/</span>
            <Link href="/shop" className="text-cream-500 hover:text-green-600 transition-colors">Shop</Link>
            <span className="text-cream-300" aria-hidden="true">/</span>
            {category && (
              <>
                <Link href={`/categories/${category.id}`} className="text-cream-500 hover:text-green-600 transition-colors">{category.name}</Link>
                <span className="text-cream-300" aria-hidden="true">/</span>
              </>
            )}
            <span className="text-gray-900 font-medium truncate max-w-[200px]" aria-current="page">{product.name}</span>
          </nav>

          {category && (
            <Link href={`/categories/${category.id}`} className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700 transition-colors">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {category.name}
            </Link>
          )}

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{product.name}</h1>

          <div className="flex flex-wrap items-center gap-4">
            <span className="text-3xl font-bold text-green-600">{price}</span>
            <Badge variant={stockStatus.variant} size="md">{stockStatus.label}</Badge>
          </div>

          {product.description && (
            <div className="prose prose-cream max-w-none">
              <p className="text-cream-600 whitespace-pre-line">{product.description}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <ProductQuantitySelector
              maxQuantity={product.stock_quantity}
              initialQuantity={Math.min(quantity, product.stock_quantity)}
              onQuantityChange={setQuantity}
              disabled={isUnavailable}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-cream-200">
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={handleAddToCart}
              disabled={isUnavailable || addedToCart}
              loading={addedToCart}
            >
              {addedToCart ? 'Added to Cart' : isInCartResult ? 'Update Cart' : 'Add to Cart'}
            </Button>
            <Link
              href="/cart"
              className="hidden sm:inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium rounded-xl border border-cream-200 bg-white text-gray-700 hover:bg-cream-50 hover:border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>View Cart</span>
            </Link>
          </div>

          {isUnavailable && (
            <p className="text-sm text-red-600" role="alert">
              {isOutOfStock
                ? 'This product is currently out of stock.'
                : 'This product is unavailable at the moment.'}
            </p>
          )}
          {isInCartResult && !addedToCart && !isUnavailable && (
            <p className="text-sm text-green-600" role="status" aria-live="polite">
              Already in cart ({inCartQuantity})
            </p>
          )}
        </div>
      </div>

      <div className="mt-12">
        <ProductReviews productId={product.id} />
      </div>
    </div>
  );
}