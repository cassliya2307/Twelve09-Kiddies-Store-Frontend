'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ProductQuantitySelectorProps {
  maxQuantity: number;
  initialQuantity?: number;
  onQuantityChange?: (quantity: number) => void;
  disabled?: boolean;
}

function clampQuantity(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(Math.max(1, value), max);
}

export function ProductQuantitySelector({
  maxQuantity,
  initialQuantity = 1,
  onQuantityChange,
  disabled = false,
}: ProductQuantitySelectorProps) {
  const [quantity, setQuantity] = useState(() => clampQuantity(initialQuantity, maxQuantity));

  useEffect(() => {
    setQuantity((prev) => {
      const clamped = clampQuantity(initialQuantity, maxQuantity);
      if (clamped !== prev) return clamped;
      return prev;
    });
  }, [initialQuantity, maxQuantity]);

  const handleIncrement = () => {
    if (!disabled && quantity < maxQuantity) {
      const next = quantity + 1;
      setQuantity(next);
      if (onQuantityChange) onQuantityChange(next);
    }
  };

  const handleDecrement = () => {
    if (!disabled && quantity > 1) {
      const next = quantity - 1;
      setQuantity(next);
      if (onQuantityChange) onQuantityChange(next);
    }
  };

  const handleInputChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1 && num <= maxQuantity) {
      setQuantity(num);
      if (onQuantityChange) onQuantityChange(num);
    }
  };

  const handleBlur = () => {
    setQuantity((prev) => clampQuantity(prev, maxQuantity));
  };

  const isAtMin = quantity <= 1;
  const isAtMax = quantity >= maxQuantity;

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Quantity selector">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || isAtMin}
        aria-label="Decrease quantity"
        aria-disabled={disabled || isAtMin}
        className={cn(
          'inline-flex items-center justify-center w-10 h-10 rounded-xl border border-cream-200 bg-white text-gray-700',
          'hover:bg-cream-50 hover:border-green-300',
          'focus:outline-none focus:ring-2 focus:ring-green-500',
          'transition-colors duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-cream-200'
        )}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>

      <input
        type="number"
        value={quantity}
        onChange={(e) => handleInputChange(e.target.value)}
        onBlur={handleBlur}
        min={1}
        max={maxQuantity}
        disabled={disabled}
        aria-label="Quantity"
        className={cn(
          'w-16 h-10 text-center text-base font-medium text-gray-900',
          'border-y border-cream-200 bg-white',
          'focus:outline-none focus:ring-2 focus:ring-green-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          '[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
        )}
      />

      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || isAtMax}
        aria-label="Increase quantity"
        aria-disabled={disabled || isAtMax}
        className={cn(
          'inline-flex items-center justify-center w-10 h-10 rounded-xl border border-cream-200 bg-white text-gray-700',
          'hover:bg-cream-50 hover:border-green-300',
          'focus:outline-none focus:ring-2 focus:ring-green-500',
          'transition-colors duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-cream-200'
        )}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      <span className="text-sm text-cream-500" aria-live="polite">
        {maxQuantity > 0 ? `of ${maxQuantity} available` : 'Out of stock'}
      </span>
    </div>
  );
}

