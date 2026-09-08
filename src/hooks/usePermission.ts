'use client';

import { useAuth } from '@/context/AuthContext';

export type SupportedPermission =
  | 'VIEW_REPORTS'
  | 'MANAGE_PRODUCTS'
  | 'MANAGE_INVENTORY'
  | 'MANAGE_ORDERS'
  | 'MANAGE_EXPENSES';

const SUPPORTED_PERMISSIONS: SupportedPermission[] = [
  'VIEW_REPORTS',
  'MANAGE_PRODUCTS',
  'MANAGE_INVENTORY',
  'MANAGE_ORDERS',
  'MANAGE_EXPENSES',
];

export function usePermission() {
  const { user } = useAuth();

  const isAdmin = user?.role === 'ADMIN';
  const permissions = (user?.permissions as SupportedPermission[] | undefined) ?? [];

  const hasPermission = (permission: SupportedPermission): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    return permissions.includes(permission);
  };

  const hasAnySupportedPermission = (): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    return permissions.some((p) => (SUPPORTED_PERMISSIONS as string[]).includes(p));
  };

  return {
    isAdmin,
    permissions,
    hasPermission,
    hasAnySupportedPermission,
    supportedPermissions: SUPPORTED_PERMISSIONS,
  };
}
