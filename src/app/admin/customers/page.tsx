'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { getCustomerOrders, getCustomers } from '@/lib/api';
import type { CustomerOrderSummary, CustomerSummary } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useRouter } from 'next/navigation';

const PAGE_SIZE = 20;

export default function AdminCustomersPage() {
  const { isLoading: authLoading, isAuthorized } = useAdminGuard({ requirePermission: 'MANAGE_CUSTOMERS' });
  const router = useRouter();

  const [users, setUsers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [listQuery, setListQuery] = useState({ page: 1, search: '', activeFilter: '' });
  const [hasNextPage, setHasNextPage] = useState(false);
  const [listRetry, setListRetry] = useState(0);
  const requestSequence = useRef(0);
  const detailSequence = useRef(0);
  const dialogGeneration = useRef(0);
  const detailsRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const [selectedUser, setSelectedUser] = useState<CustomerSummary | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [userOrders, setUserOrders] = useState<CustomerOrderSummary[]>([]);
  const [detailPage, setDetailPage] = useState(0);
  const [detailHasNextPage, setDetailHasNextPage] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [retryOrderHistory, setRetryOrderHistory] = useState(0);

  useEffect(() => {
    const normalizedSearch = search.trim();
    if (normalizedSearch === listQuery.search) return;

    const t = setTimeout(() => {
      setListQuery((current) => ({ ...current, page: 1, search: normalizedSearch }));
    }, 300);
    return () => clearTimeout(t);
  }, [search, listQuery.search]);

  useEffect(() => {
    if (authLoading || !isAuthorized) return;

    const sequence = ++requestSequence.current;
    let cancelled = false;
    setLoading(true);
    setError(null);

    getCustomers({
      skip: (listQuery.page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
      is_active: listQuery.activeFilter === '' ? undefined : listQuery.activeFilter === 'true',
      search: listQuery.search || undefined,
    })
      .then((data) => {
        if (cancelled || sequence !== requestSequence.current) return;
        setUsers(data.items);
        setHasNextPage(data.has_more);
      })
      .catch((err) => {
        if (cancelled || sequence !== requestSequence.current) return;
        setUsers([]);
        setHasNextPage(false);
        setError(err instanceof Error ? err.message : 'Failed to load customers');
      })
      .finally(() => {
        if (!cancelled && sequence === requestSequence.current) setLoading(false);
      });

    return () => {
      cancelled = true;
      requestSequence.current += 1;
    };
  }, [authLoading, isAuthorized, listQuery, listRetry]);

  const openDetail = (customer: CustomerSummary, opener: HTMLButtonElement) => {
    detailSequence.current += 1;
    dialogGeneration.current += 1;
    openerRef.current = opener;
    setSelectedUser(customer);
    setUserOrders([]);
    setDetailPage(0);
    setDetailHasNextPage(false);
    setOrderError(null);
    setDetailLoading(true);
  };

  const closeDetail = useCallback(() => {
    detailSequence.current += 1;
    const closingGeneration = ++dialogGeneration.current;
    setSelectedUser(null);
    setUserOrders([]);
    setDetailPage(0);
    setDetailHasNextPage(false);
    setOrderError(null);
    setDetailLoading(false);
    requestAnimationFrame(() => {
      if (dialogGeneration.current !== closingGeneration) return;
      if (openerRef.current?.isConnected) openerRef.current.focus();
      else searchInputRef.current?.focus();
    });
  }, []);

  useEffect(() => {
    if (!selectedUser) return;

    const sequence = ++detailSequence.current;
    let cancelled = false;

    getCustomerOrders(selectedUser.id, { skip: detailPage * PAGE_SIZE, limit: PAGE_SIZE })
      .then((response) => {
        if (!cancelled && sequence === detailSequence.current) {
          setUserOrders(response.items);
          setDetailHasNextPage(response.has_more);
        }
      })
      .catch((err) => {
        if (!cancelled && sequence === detailSequence.current) {
          setOrderError(err instanceof Error ? err.message : 'Failed to load order history');
        }
      })
      .finally(() => {
        if (!cancelled && sequence === detailSequence.current) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedUser, detailPage, retryOrderHistory]);

  useEffect(() => {
    if (!selectedUser) return;
    const focusFrame = requestAnimationFrame(() => closeButtonRef.current?.focus());

    const containFocus = (event: FocusEvent) => {
      const dialog = detailsRef.current;
      if (dialog && event.target instanceof Node && !dialog.contains(event.target)) {
        closeButtonRef.current?.focus();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDetail();
        return;
      }

      if (event.key !== 'Tab' || !detailsRef.current) return;
      const focusable = detailsRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === detailsRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === detailsRef.current)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', containFocus);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', containFocus);
    };
  }, [selectedUser, closeDetail]);

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Skeleton variant="text" width="30%" height="32px" />
          <Skeleton variant="rectangular" className="h-64 rounded-2xl" />
        </div>
      </AdminLayout>
    );
  }

  if (!isAuthorized) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-cream-600">You must be an administrator or have customer-management access.</p>
          <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>Go to Dashboard</Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-cream-600">Manage store customers and user accounts.</p>
        </div>

        <div className="bg-white rounded-2xl border border-cream-200 p-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="customer-search" className="sr-only">
              Search customers
            </label>
            <input
              ref={searchInputRef}
              id="customer-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <select
            value={listQuery.activeFilter}
            onChange={(e) => setListQuery((current) => ({
              ...current,
              page: 1,
              activeFilter: e.target.value,
            }))}
            className="px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label="Filter by active status"
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <div className="text-sm text-cream-600 flex items-center">
            {loading ? 'Loading...' : `${users.length} user${users.length !== 1 ? 's' : ''}`}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4" role="alert">
            <p className="text-sm text-red-700">{error}</p>
            <Button variant="outline" size="sm" onClick={() => setListRetry((retry) => retry + 1)}>Retry</Button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-cream-200 p-6 space-y-3">
                <Skeleton variant="text" width="30%" />
                <Skeleton variant="text" width="50%" />
              </div>
            ))}
          </div>
        ) : error ? null : users.length === 0 ? (
          <div className="bg-white rounded-2xl border border-cream-200 p-12 text-center">
            <p className="text-cream-600">No customers found.</p>
            <p className="text-sm text-cream-500 mt-1">Try adjusting search or filters.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-cream-50 border-b border-cream-200 text-left">
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      Name
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      Email
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      Role
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isActive = u.is_active;
                    return (
                      <tr key={u.id} className="border-b border-cream-100 last:border-0 hover:bg-cream-50/50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{u.name}</p>
                            <p className="text-xs text-cream-500">ID {u.id}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{u.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge size="sm" className="bg-cream-100 text-cream-600">
                            {formatRole(u.role)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={isActive ? 'success' : 'danger'} size="sm">
                            {isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(event) => openDetail(u, event.currentTarget)}
                              aria-label={`View details for user ${u.email}`}
                            >
                              Details
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-cream-50 border-t border-cream-200 text-xs text-cream-600">
              Showing {users.length} customers on this page.
            </div>
          </div>
        )}

        {!loading && !error && (users.length > 0 || listQuery.page > 1) && (
          <div className="p-4 bg-cream-50 border-t border-cream-200 text-xs text-cream-600">
            <div className="flex justify-between items-center">
              <span>
                Page {listQuery.page}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={listQuery.page <= 1}
                  onClick={() => setListQuery((current) => ({
                    ...current,
                    page: Math.max(1, current.page - 1),
                  }))}
                  aria-label="Previous page"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasNextPage}
                  onClick={() => setListQuery((current) => ({ ...current, page: current.page + 1 }))}
                  aria-label="Next page"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Customer Detail Drawer */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={closeDetail}
              aria-hidden="true"
            />
            <div
              ref={detailsRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="customer-details-title"
              tabIndex={-1}
              onClick={(event) => event.stopPropagation()}
              className="relative bg-white rounded-2xl border border-cream-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white p-6 border-b border-cream-200 flex justify-between items-start gap-4">
                <div>
                  <h2 id="customer-details-title" className="text-xl font-bold text-gray-900">
                    Customer Details
                  </h2>
                  <p className="text-sm text-cream-600">
                    {selectedUser.name} · {selectedUser.email}
                  </p>
                </div>
                <Button
                  ref={closeButtonRef}
                  variant="ghost"
                  size="sm"
                  onClick={closeDetail}
                  aria-label="Close customer details"
                >
                  Close
                </Button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Profile</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="text-cream-600 font-medium w-16">Name:</span>
                      <span>{selectedUser.name}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-cream-600 font-medium w-16">Email:</span>
                      <span>{selectedUser.email}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-cream-600 font-medium w-16">Role:</span>
                      <Badge
                        size="sm"
                        className={
                          selectedUser.role === 'ADMIN'
                            ? 'bg-green-100 text-green-800'
                            : selectedUser.role === 'STAFF'
                              ? 'bg-cream-100 text-cream-800'
                              : 'bg-cream-100 text-cream-600'
                        }
                      >
                        {formatRole(selectedUser.role)}
                      </Badge>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-cream-600 font-medium w-16">Status:</span>
                      <Badge
                        variant={selectedUser.is_active ? 'success' : 'danger'}
                        size="sm"
                      >
                        {selectedUser.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {detailLoading ? (
                  <div role="status" aria-live="polite" className="space-y-3">
                    <Skeleton variant="text" width="40%" />
                    <Skeleton variant="rectangular" className="h-16 rounded-xl" />
                  </div>
                ) : orderError ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3" role="alert">
                    <p className="text-sm text-red-700">{orderError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDetailLoading(true);
                        setOrderError(null);
                        setRetryOrderHistory((attempt) => attempt + 1);
                      }}
                      className="mt-3"
                    >
                      Retry order history
                    </Button>
                  </div>
                ) : userOrders.length > 0 ? (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Order History</h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {userOrders.map((o) => (
                        <div
                          key={o.id}
                          className="bg-cream-50 rounded-xl p-3 border border-cream-200 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-900">
                              Order #{o.id}
                            </span>
                            <span className="text-xs text-cream-500">
                              {formatOrderDate(o.created_at)}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{formatNGN(o.total_amount)}</span>
                          <Badge
                            variant={o.status === 'COMPLETED' ? 'success' : o.status === 'CANCELLED' ? 'danger' : o.status === 'PENDING' ? 'warning' : 'info'}
                            size="sm"
                          >
                            {o.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : detailPage > 0 ? (
                  <p className="text-sm text-cream-600">No more orders on this page. Use Previous to view earlier orders.</p>
                ) : (
                  <p className="text-sm text-cream-600">
                    No order history available for this customer.
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-cream-200 p-4 text-xs text-cream-600">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={detailPage === 0 || detailLoading}
                  onClick={() => {
                    setDetailLoading(true);
                    setUserOrders([]);
                    setOrderError(null);
                    setDetailPage((current) => Math.max(0, current - 1));
                  }}
                >
                  Previous
                </Button>
                <span>Page {detailPage + 1}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!detailHasNextPage || detailLoading}
                  onClick={() => {
                    setDetailLoading(true);
                    setUserOrders([]);
                    setOrderError(null);
                    setDetailPage((current) => current + 1);
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function formatRole(role: string): string {
  switch (role) {
    case 'CUSTOMER':
      return 'Customer';
    case 'STAFF':
      return 'Staff';
    case 'ADMIN':
      return 'Admin';
    default:
      return role;
  }
}

function formatOrderDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatNGN(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  return num.toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}