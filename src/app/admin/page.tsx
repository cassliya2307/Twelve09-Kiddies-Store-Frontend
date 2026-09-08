'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';

export default function AdminEntryPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { isAdmin, hasPermission } = usePermission();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/login?redirect=/admin');
      return;
    }

    if (isAdmin) {
      router.replace('/admin/dashboard');
      return;
    }

    // Staff deterministic priority
    if (hasPermission('VIEW_REPORTS')) {
      router.replace('/admin/dashboard');
      return;
    }
    if (hasPermission('MANAGE_PRODUCTS')) {
      router.replace('/admin/products');
      return;
    }
    if (hasPermission('MANAGE_INVENTORY')) {
      router.replace('/admin/inventory');
      return;
    }
    if (hasPermission('MANAGE_ORDERS')) {
      router.replace('/admin/orders');
      return;
    }
    if (hasPermission('MANAGE_EXPENSES')) {
      router.replace('/admin/expenses');
      return;
    }

    router.replace('/admin/unauthorized');
  }, [isLoading, isAuthenticated, isAdmin, hasPermission, router]);

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-3 text-cream-600">
        <div className="h-6 w-32 bg-cream-200 rounded" />
        <p className="text-sm">Loading portal...</p>
      </div>
    </div>
  );
}
