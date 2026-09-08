'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePermission, SupportedPermission } from '@/hooks/usePermission';
import { Button } from '@/components/ui/Button';

interface NavItem {
  label: string;
  href: string;
  adminOnly?: boolean;
  permission?: SupportedPermission;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', permission: 'VIEW_REPORTS' },
  { label: 'Products', href: '/admin/products', permission: 'MANAGE_PRODUCTS' },
  { label: 'Inventory', href: '/admin/inventory', permission: 'MANAGE_INVENTORY' },
  { label: 'Categories', href: '/admin/categories', adminOnly: true },
  { label: 'Orders', href: '/admin/orders', permission: 'MANAGE_ORDERS' },
  { label: 'Expenses', href: '/admin/expenses', permission: 'MANAGE_EXPENSES' },
  { label: 'Staff', href: '/admin/staff', adminOnly: true },
  { label: 'Delivery Fee', href: '/admin/delivery-fee', adminOnly: true },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { isAdmin, hasPermission } = usePermission();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.adminOnly) return isAdmin;
    if (item.permission) return isAdmin || hasPermission(item.permission);
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3 text-cream-600">
          <div className="h-8 w-32 bg-cream-200 rounded" />
          <p className="text-sm">Loading portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-cream-200 flex-col">
        <div className="p-6 border-b border-cream-200">
          <Link href="/admin" className="flex items-center gap-2" aria-label="Admin Home">
            <span className="text-xl font-bold text-green-800">Twelve09</span>
            <span className="text-sm text-cream-600">Admin</span>
          </Link>
          {user && (
            <div className="mt-4 text-sm">
              <p className="font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-cream-600 truncate text-xs">{user.email}</p>
              <p className="mt-1 inline-flex px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">{user.role}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Admin navigation">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`block px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-green-100 text-green-800' : 'text-gray-700 hover:bg-cream-50'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          {visibleNavItems.length === 0 && (
            <p className="px-3 py-2 text-sm text-cream-500">No permitted sections</p>
          )}
        </nav>

        <div className="p-4 border-t border-cream-200 space-y-2">
          <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start">
            Logout
          </Button>
          <Link href="/" className="block text-xs text-cream-500 hover:text-green-600 text-center">
            ← Back to Store
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden bg-white border-b border-cream-200 p-4 flex items-center justify-between">
          <Link href="/admin" className="font-bold text-green-800">
            Admin
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        {/* Mobile nav scroll */}
        <div className="md:hidden bg-white border-b border-cream-200 overflow-x-auto">
          <nav className="flex gap-2 p-2" aria-label="Admin navigation mobile">
            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-sm ${isActive ? 'bg-green-100 text-green-800' : 'bg-cream-50 text-gray-700'}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
