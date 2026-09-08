'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePermission, SupportedPermission } from '@/hooks/usePermission';

interface UseAdminGuardOptions {
  requireAdmin?: boolean;
  requirePermission?: SupportedPermission;
}

export function useAdminGuard(options: UseAdminGuardOptions = {}) {
  const { requireAdmin = false, requirePermission } = options;
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { isAdmin, hasPermission, hasAnySupportedPermission } = usePermission();

  const isAuthorized = (() => {
    if (isLoading || !isAuthenticated || !user) return false;
    if (requireAdmin) return isAdmin;
    if (requirePermission) return isAdmin || hasPermission(requirePermission);
    return isAdmin || hasAnySupportedPermission();
  })();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.replace('/login?redirect=/admin');
      return;
    }
    if (requireAdmin && !isAdmin) {
      router.replace('/admin/unauthorized');
      return;
    }
    if (requirePermission && !hasPermission(requirePermission) && !isAdmin) {
      router.replace('/admin/unauthorized');
    }
  }, [isLoading, isAuthenticated, user, isAdmin, requireAdmin, requirePermission, hasPermission, router]);

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    isAuthorized: isLoading ? false : isAuthorized,
    hasPermission,
  };
}
