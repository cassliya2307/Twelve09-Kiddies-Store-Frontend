'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { getAdminUsers, updateUserRole, updateUserPermissions } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { User } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

const ALL_PERMISSIONS = [
  'MANAGE_PRODUCTS',
  'MANAGE_INVENTORY',
  'MANAGE_ORDERS',
  'MANAGE_CUSTOMERS',
  'MANAGE_DELIVERIES',
  'MANAGE_EXPENSES',
  'VIEW_REPORTS',
] as const;

export default function AdminStaffPage() {
  const { isLoading: authLoading, isAuthorized } = useAdminGuard({ requireAdmin: true });
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('');

  const [editingPerms, setEditingPerms] = useState<User | null>(null);
  const [pendingPerms, setPendingPerms] = useState<string[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);
  const [permError, setPermError] = useState<string | null>(null);

  const [editingRole, setEditingRole] = useState<User | null>(null);
  const [pendingRole, setPendingRole] = useState<string>('');
  const [pendingActive, setPendingActive] = useState<boolean>(true);
  const [savingRole, setSavingRole] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminUsers({
        role: roleFilter || undefined,
        is_active: activeFilter === '' ? undefined : activeFilter === 'true',
        search: debouncedSearch || undefined,
        limit: 100,
      });
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, activeFilter, debouncedSearch]);

  useEffect(() => {
    if (!authLoading && isAuthorized) void fetchUsers();
  }, [authLoading, isAuthorized, fetchUsers]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const openPerms = (u: User) => {
    if (u.role !== 'STAFF') return;
    if (currentUser && u.id === currentUser.id) return;
    setEditingPerms(u);
    setPendingPerms([...(u.permissions || [])]);
    setPermError(null);
  };

  const handleSavePerms = async () => {
    if (!editingPerms || savingPerms) return;
    setSavingPerms(true);
    setPermError(null);
    try {
      const updated = await updateUserPermissions(editingPerms.id, pendingPerms);
      setSuccess(`Permissions updated for ${updated.email}`);
      setEditingPerms(null);
      await fetchUsers();
    } catch (err) {
      setPermError(err instanceof Error ? err.message : 'Failed to update permissions');
    } finally {
      setSavingPerms(false);
    }
  };

  const openRole = (u: User) => {
    if (currentUser && u.id === currentUser.id) return;
    if (u.role === 'ADMIN') return;
    setEditingRole(u);
    setPendingRole(u.role);
    setPendingActive(u.is_active);
    setRoleError(null);
  };

  const handleSaveRole = async () => {
    if (!editingRole || savingRole) return;
    if (pendingRole === 'ADMIN') {
      setRoleError('Cannot promote to Admin — only one Admin allowed.');
      return;
    }
    setSavingRole(true);
    setRoleError(null);
    try {
      const payload: { role?: string; is_active?: boolean } = {};
      if (pendingRole !== editingRole.role) payload.role = pendingRole;
      if (pendingActive !== editingRole.is_active) payload.is_active = pendingActive;
      if (Object.keys(payload).length === 0) {
        setEditingRole(null);
        return;
      }
      const updated = await updateUserRole(editingRole.id, payload);
      setSuccess(`User ${updated.email} updated to ${updated.role}${payload.is_active !== undefined ? (updated.is_active ? ' (active)' : ' (inactive)') : ''}`);
      setEditingRole(null);
      await fetchUsers();
    } catch (err) {
      setRoleError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setSavingRole(false);
    }
  };

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-sm text-cream-600">Admin-only: manage Staff accounts, roles, and permissions. Single Admin invariant enforced server-side.</p>
        </div>

        <div className="bg-white rounded-2xl border border-cream-200 p-4 flex flex-col lg:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="staff-search" className="sr-only">
              Search staff
            </label>
            <input
              id="staff-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label="Filter by role"
          >
            <option value="">All roles</option>
            <option value="STAFF">STAFF</option>
            <option value="CUSTOMER">CUSTOMER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label="Filter by active status"
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <div className="text-sm text-cream-600 flex items-center">{loading ? 'Loading...' : `${users.length} user${users.length !== 1 ? 's' : ''}`}</div>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4" role="status">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4" role="alert">
            <p className="text-sm text-red-700">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={fetchUsers}>
              Retry
            </Button>
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
        ) : users.length === 0 && !error ? (
          <div className="bg-white rounded-2xl border border-cream-200 p-12 text-center">
            <p className="text-cream-600">No users found.</p>
            <p className="text-sm text-cream-500 mt-1">Try adjusting search or filters.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-cream-50 border-b border-cream-200 text-left">
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      User
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      Role
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      Active
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      Permissions
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium text-cream-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = currentUser ? u.id === currentUser.id : false;
                    const isAdminUser = u.role === 'ADMIN';
                    return (
                      <tr key={u.id} className="border-b border-cream-100 last:border-0 hover:bg-cream-50/50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{u.name}</p>
                            <p className="text-xs text-cream-600">{u.email}</p>
                            <p className="text-xs text-cream-500">ID {u.id}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={isAdminUser ? 'success' : u.role === 'STAFF' ? 'info' : 'default'} size="sm">
                            {u.role}
                          </Badge>
                          {isSelf && <span className="ml-2 text-xs text-cream-500">(you)</span>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={u.is_active ? 'success' : 'danger'} size="sm">
                            {u.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          {u.role === 'STAFF' ? (
                            u.permissions.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {u.permissions.map((p) => (
                                  <Badge key={p} variant="default" size="sm">
                                    {p}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-cream-500">No permissions</span>
                            )
                          ) : (
                            <span className="text-xs text-cream-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRole(u)}
                              disabled={isSelf || isAdminUser}
                              aria-label={`Change role for ${u.email}`}
                              title={isSelf ? 'Cannot modify own role' : isAdminUser ? 'Admin role protected' : 'Change role'}
                            >
                              Role
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openPerms(u)}
                              disabled={u.role !== 'STAFF' || isSelf}
                              aria-label={`Edit permissions for ${u.email}`}
                              title={u.role !== 'STAFF' ? 'Only STAFF can have permissions' : isSelf ? 'Cannot modify own' : 'Edit permissions'}
                            >
                              Perms
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
              Admin cannot change own role/permissions and cannot create a second Admin. Backend enforces these rules.
            </div>
          </div>
        )}

        {/* Role Editor */}
        {editingRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => !savingRole && setEditingRole(null)} aria-hidden="true" />
            <div className="relative bg-white rounded-2xl border border-cream-200 w-full max-w-md p-6">
              <h2 className="text-lg font-bold text-gray-900">Change Role</h2>
              <p className="text-sm text-cream-600 mt-1">
                {editingRole.name} ({editingRole.email}) — current: {editingRole.role}
              </p>
              {roleError && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3" role="alert">
                  <p className="text-sm text-red-700">{roleError}</p>
                </div>
              )}
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="role-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    id="role-select"
                    value={pendingRole}
                    onChange={(e) => setPendingRole(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="STAFF">STAFF</option>
                    <option value="ADMIN">ADMIN (blocked by backend)</option>
                  </select>
                  <p className="text-xs text-cream-500 mt-1">Choosing ADMIN will be rejected by backend (single-Admin rule).</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="role-active"
                    type="checkbox"
                    checked={pendingActive}
                    onChange={(e) => setPendingActive(e.target.checked)}
                    className="h-4 w-4 rounded border-cream-200 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="role-active" className="text-sm text-gray-700">
                    Active
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setEditingRole(null)} disabled={savingRole} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="button" variant="primary" loading={savingRole} disabled={savingRole} onClick={handleSaveRole} className="flex-1">
                    Save
                  </Button>
                </div>
                <p className="text-xs text-cream-500 text-center">Requires confirmation — backend remains authoritative.</p>
              </div>
            </div>
          </div>
        )}

        {/* Permissions Editor */}
        {editingPerms && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => !savingPerms && setEditingPerms(null)} aria-hidden="true" />
            <div className="relative bg-white rounded-2xl border border-cream-200 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold text-gray-900">Edit Permissions</h2>
              <p className="text-sm text-cream-600 mt-1">
                {editingPerms.name} ({editingPerms.email})
              </p>
              {permError && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3" role="alert">
                  <p className="text-sm text-red-700">{permError}</p>
                </div>
              )}
              <div className="mt-4 space-y-3">
                {ALL_PERMISSIONS.map((perm) => (
                  <label key={perm} className="flex items-center gap-3 p-2 rounded-xl hover:bg-cream-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pendingPerms.includes(perm)}
                      onChange={(e) => {
                        if (e.target.checked) setPendingPerms([...pendingPerms, perm]);
                        else setPendingPerms(pendingPerms.filter((p) => p !== perm));
                      }}
                      className="h-4 w-4 rounded border-cream-200 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">{perm}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 pt-6">
                <Button type="button" variant="outline" onClick={() => setEditingPerms(null)} disabled={savingPerms} className="flex-1">
                  Cancel
                </Button>
                <Button type="button" variant="primary" loading={savingPerms} disabled={savingPerms} onClick={handleSavePerms} className="flex-1">
                  Save Permissions
                </Button>
              </div>
              <p className="text-xs text-cream-500 mt-3 text-center">Only STAFF can have permissions. Admin bypass is implicit.</p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
