'use client';

import Link from 'next/link';
import { ProductImage } from '@/components/ui/ProductImage';
import { Badge } from '@/components/ui/Badge';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';
import type { ProductListItem } from '@/types/api';

interface ProductCardProps {
  product: ProductListItem;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, removeFromCart, getCartQuantity } = useCart();
  const [addedToCart, setAddedToCart] = useState(false);

  const numericPrice = Number(product.price || 0);
  const price = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericPrice).replace('NGN', '₦');

  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;
  const isOutOfStock = product.stock_quantity === 0;
  const isUnavailable = !product.is_active || isOutOfStock;

  const inCartQuantity = getCartQuantity(product.id);
  const isInCartResult = inCartQuantity > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  
    console.log("Cart button clicked for:", product.name);
  
    if (isInCartResult) {
      removeFromCart(product.id);
    } else {
      addToCart(product, 1);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  return (
    <article className="group relative overflow-hidden rounded-[1.75rem] border border-cream-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card)]">
      <Link href={`/products/${product.id}`} className="block" aria-label={`View ${product.name}`}>
        <div className="relative aspect-square overflow-hidden bg-cream-50">
          <ProductImage
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          {(isLowStock || isOutOfStock) && (
            <div className="absolute left-3 top-3 z-10">
              <Badge variant={isOutOfStock ? 'danger' : 'warning'} size="sm">
                {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
              </Badge>
            </div>
          )}
          {!product.is_active && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Badge variant="danger">Unavailable</Badge>
            </div>
          )}
        </div>
      </Link>

      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-green-800">Play pick</span>
            </div>
            <h3 className="line-clamp-2 text-base font-black leading-6 tracking-tight text-charcoal transition group-hover:text-green-800">
              {product.name}
            </h3>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex flex-col gap-2">
            <span className="text-2xl font-black tracking-tight text-green-800">{price}</span>
            <span className="flex items-center gap-1 text-amber-500" aria-label="Rated 4.8 out of 5">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 1.5l2.8 6 6.2.9-4.5 4.4 1.1 6.2-6.1-3.2-6.1 3.2 1.1-6.2-4.5-4.4 6.2-.9L10 1.5z" />
              </svg>
              <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 1.5l2.8 6 6.2.9-4.5 4.4 1.1 6.2-6.1-3.2-6.1 3.2 1.1-6.2-4.5-4.4 6.2-.9L10 1.5z" />
              </svg>
              <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 1.5l2.8 6 6.2.9-4.5 4.4 1.1 6.2-6.1-3.2-6.1 3.2 1.1-6.2-4.5-4.4 6.2-.9L10 1.5z" />
              </svg>
              <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 1.5l2.8 6 6.2.9-4.5 4.4 1.1 6.2-6.1-3.2-6.1 3.2 1.1-6.2-4.5-4.4 6.2-.9L10 1.5z" />
              </svg>
              <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 1.5l2.8 6 6.2.9-4.5 4.4 1.1 6.2-6.1-3.2-6.1 3.2 1.1-6.2-4.5-4.4 6.2-.9L10 1.5z" />
              </svg>
            </span>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={addedToCart}
            className="relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-green-700 text-white shadow-sm transition hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={isUnavailable ? `${product.name} is unavailable` : isInCartResult ? `Remove ${product.name} from cart` : `Add ${product.name} to cart`}
            aria-disabled={addedToCart}
          >
            {isInCartResult ? (
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>
            ) : addedToCart ? (
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            ) : (
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}