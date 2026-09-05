'use client';

import { useState, ImgHTMLAttributes, forwardRef } from 'react';

interface ProductImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | null | undefined;
  alt: string;
  fallback?: string;
  className?: string;
}

export const ProductImage = forwardRef<HTMLImageElement, ProductImageProps>(
  ({ src, alt, fallback, className = '', ...props }, ref) => {
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const handleError = () => {
      setImageError(true);
      setIsLoading(false);
    };

    const handleLoad = () => {
      setIsLoading(false);
    };

    const imageSrc = imageError || !src ? fallback || '/placeholder-product.svg' : src;

    return (
      <div className="relative overflow-hidden bg-cream-100" {...props}>
        <img
          ref={ref}
          src={imageSrc}
          alt={alt}
          onError={handleError}
          onLoad={handleLoad}
          className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`}
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-cream-100">
            <svg className="animate-spin h-8 w-8 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
      </div>
    );
  }
);

ProductImage.displayName = 'ProductImage';