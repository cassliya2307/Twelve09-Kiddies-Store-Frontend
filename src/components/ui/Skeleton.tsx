'use client';

import { HTMLAttributes, forwardRef } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className = '', variant = 'text', width, height, ...props }, ref) => {
    const baseStyles = 'animate-pulse bg-cream-200 rounded';
    
    const variantStyles = {
      text: 'h-4 rounded',
      circular: 'rounded-full',
      rectangular: 'rounded-xl',
    };

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        style={{ width, height }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

export const ProductCardSkeleton = () => (
  <article className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
    <Skeleton variant="rectangular" className="aspect-square" />
    <div className="p-4 space-y-3">
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="text" width="50%" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton variant="text" width="25%" />
        <Skeleton variant="circular" className="w-10 h-10" />
      </div>
    </div>
  </article>
);

export const CategoryCardSkeleton = () => (
  <div className="text-center">
    <Skeleton variant="circular" className="w-20 h-20 mx-auto mb-3" />
    <Skeleton variant="text" width="70%" className="mx-auto" />
  </div>
);

export const ProductDetailsSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
    <div className="space-y-4">
      <Skeleton variant="rectangular" className="aspect-[4/5] rounded-2xl" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton variant="rectangular" className="aspect-square rounded-xl" />
        <Skeleton variant="rectangular" className="aspect-square rounded-xl" />
      </div>
    </div>
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Skeleton variant="text" width="80px" height="24px" />
        <Skeleton variant="text" width="100px" height="24px" />
      </div>
      <Skeleton variant="text" width="90%" />
      <Skeleton variant="text" width="60%" />
      <div className="flex items-center gap-4">
        <Skeleton variant="text" width="120px" height="32px" />
        <Skeleton variant="text" width="80px" height="32px" />
      </div>
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="100%" />
      <div className="flex gap-4">
        <Skeleton variant="rectangular" className="w-28 h-12" />
        <Skeleton variant="rectangular" className="flex-1 h-12" />
      </div>
      <div className="flex gap-3">
        <Skeleton variant="rectangular" className="flex-1 h-12" />
        <Skeleton variant="rectangular" className="w-28 h-12" />
      </div>
    </div>
  </div>
);