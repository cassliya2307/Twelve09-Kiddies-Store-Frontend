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
  const { addToCart, getCartQuantity } = useCart();
  const [addedToCart, setAddedToCart] = useState(false);

  const price = Number(product.price).toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;
  const isOutOfStock = product.stock_quantity === 0;
  const isUnavailable = !product.is_active || isOutOfStock;

  const inCartQuantity = getCartQuantity(product.id);
  const isInCartResult = inCartQuantity > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUnavailable) {
      addToCart(product, 1);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  return (
    <article className="group relative bg-white rounded-2xl border border-cream-200 hover:border-green-300 hover:shadow-xl transition-all duration-300 overflow-hidden">
      <Link href={`/products/${product.id}`} className="block" aria-label={`View ${product.name}`}>
        <div className="relative aspect-square bg-cream-50 overflow-hidden">
          <ProductImage
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {(isLowStock || isOutOfStock) && (
            <div className="absolute top-3 left-3 z-10">
              <Badge variant={isOutOfStock ? 'danger' : 'warning'} size="sm">
                {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
              </Badge>
            </div>
          )}
          {!product.is_active && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="danger">Unavailable</Badge>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4 sm:p-5">
        <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors line-clamp-2 mb-2">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-green-600">{price}</span>
          <button
            onClick={handleAddToCart}
            disabled={isUnavailable || addedToCart}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-cream-100 text-green-600 hover:bg-green-100 hover:text-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-cream-100 disabled:hover:text-green-600"
            aria-label={isUnavailable ? `${product.name} is unavailable` : isInCartResult ? `Update quantity for ${product.name}` : `Add ${product.name} to cart`}
            aria-disabled={isUnavailable || addedToCart}
          >
            {isInCartResult && !addedToCart ? (
              <span className="text-sm font-medium text-green-700">✓ In Cart ({inCartQuantity})</span>
            ) : addedToCart ? (
              <span className="text-sm font-medium text-green-700">Added!</span>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}