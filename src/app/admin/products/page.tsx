'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { getProducts, getCategories, createProduct, updateProduct, activateProduct, deactivateProduct, uploadProductImage } from '@/lib/api';
import type { ProductListItem, Category } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

function formatNGN(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  return num.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

interface ProductFormData {
  name: string;
  description: string;
  category_id: string;
  price: string;
  cost_price: string;
  stock_quantity: string;
  image_url: string;
}

const emptyForm: ProductFormData = {
  name: '',
  description: '',
  category_id: '',
  price: '',
  cost_price: '',
  stock_quantity: '0',
  image_url: '',
};

export default function AdminProductsPage() {
  const { isLoading: authLoading, isAuthorized } = useAdminGuard({ requirePermission: 'MANAGE_PRODUCTS' });

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ProductListItem | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (selectedImagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(selectedImagePreview);
      }
    };
  }, [selectedImagePreview]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, prods] = await Promise.all([
        getCategories(),
        getProducts({ include_inactive: true, search: debouncedSearch || undefined }),
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    if (!authLoading && isAuthorized) void fetchData();
  }, [authLoading, isAuthorized, fetchData]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const openCreate = () => {
    setEditing(null);
    setSelectedImage(null);
    setSelectedImagePreview(null);
    setUploadError(null);
    setFormData(emptyForm);
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (p: ProductListItem) => {
    setEditing(p);
    setSelectedImage(null);
    setSelectedImagePreview(null);
    setUploadError(null);
    setFormData({
      name: p.name,
      description: p.description ?? '',
      category_id: String(p.category_id),
      price: String(p.price),
      cost_price: p.cost_price ? String(p.cost_price) : '',
      stock_quantity: String((p as unknown as { stock_quantity: number }).stock_quantity ?? 0),
      image_url: p.image_url ?? '',
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setSelectedImage(null);
      setSelectedImagePreview(null);
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      setUploadError('Unsupported image type. Please choose JPG, JPEG, PNG, WEBP, or GIF.');
      setSelectedImage(null);
      setSelectedImagePreview(null);
      return;
    }

    if (selectedImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(selectedImagePreview);
    }

    setUploadError(null);
    setSelectedImage(file);
    setSelectedImagePreview(URL.createObjectURL(file));
  };

  const uploadSelectedImage = async (productId: number) => {
    if (!selectedImage) return;

    setUploading(true);
    setUploadError(null);
    try {
      const response = await uploadProductImage(productId, selectedImage);
      setFormData({ ...formData, image_url: response.image_url });
      setSuccess('Image uploaded successfully');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Image upload failed');
      setSuccess('Product created, but image upload failed. You can retry this image from the product editor.');
    } finally {
      setUploading(false);
    }
  };

  const validate = (data: ProductFormData, isEdit: boolean): string | null => {
    if (!data.name.trim() || data.name.trim().length < 1) return 'Name is required';
    if (data.name.trim().length > 150) return 'Name must be ≤150 characters';
    if (!data.category_id) return 'Category is required';
    const price = Number(data.price);
    if (!data.price || Number.isNaN(price) || price <= 0) return 'Price must be > 0';
    if (data.cost_price) {
      const cp = Number(data.cost_price);
      if (Number.isNaN(cp) || cp < 0) return 'Cost price must be ≥ 0';
    }
    if (!isEdit) {
      const sq = Number(data.stock_quantity);
      if (data.stock_quantity === '' || Number.isNaN(sq) || sq < 0 || !Number.isInteger(sq)) return 'Stock must be integer ≥ 0';
    }
    if (data.image_url && data.image_url.length > 500) return 'Image URL too long';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editing;
    const err = validate(formData, isEdit);
    if (err) {
      setFormError(err);
      return;
    }
    setSubmitting(true);
    setFormError(null);
    setUploadError(null);
    try {
      if (isEdit && editing) {
        const payload: Record<string, unknown> = {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          category_id: Number(formData.category_id),
          price: formData.price.trim(),
          image_url: formData.image_url.trim() || null,
        };
        if (formData.cost_price.trim()) payload.cost_price = formData.cost_price.trim();

        const updatedProduct = await updateProduct(editing.id, payload as never);
        setSuccess('Product updated successfully');

        if (selectedImage) {
          try {
            setUploading(true);
            const response = await uploadProductImage(editing.id, selectedImage);
            setFormData({ ...formData, image_url: response.image_url });
            setSuccess('Product updated and image uploaded successfully');
            setSelectedImage(null);
            setSelectedImagePreview(null);
            await fetchData();
          } catch (uploadErr) {
            const msg = uploadErr instanceof Error ? uploadErr.message : 'Image upload failed';
            setUploadError(msg);
            setError(`Product updated, but image upload failed: ${msg}. You can retry the image from the product editor.`);
            setSuccess('Product updated, but image upload failed. Please try again.');
          } finally {
            setUploading(false);
          }
        }

        setShowForm(false);
        setEditing(null);
        await fetchData();
      } else {
        const createdProduct = await createProduct({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          category_id: Number(formData.category_id),
          price: formData.price.trim(),
          cost_price: formData.cost_price.trim() || null,
          stock_quantity: Number(formData.stock_quantity),
          image_url: formData.image_url.trim() || null,
        });

        setSuccess('Product created successfully');

        if (selectedImage) {
          try {
            setUploading(true);
            const response = await uploadProductImage(createdProduct.id, selectedImage);
            setFormData({ ...formData, image_url: response.image_url });
            setSuccess('Product created and image uploaded successfully');
          } catch (uploadErr) {
            const msg = uploadErr instanceof Error ? uploadErr.message : 'Image upload failed';
            setUploadError(msg);
            setError(`Product created, but image upload failed: ${msg}. You can retry the image from the product editor.`);
            setSuccess('Product created, but image upload failed. Please retry the image upload from the product editor.');
          } finally {
            setUploading(false);
          }
        }

        setShowForm(false);
        setEditing(null);
        await fetchData();
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (p: ProductListItem) => {
    if (togglingId) return;
    // confirm deactivate
    if (p.is_active && !confirm(`Deactivate "${p.name}"? It will be hidden from customers.`)) return;
    setTogglingId(p.id);
    try {
      if (p.is_active) await deactivateProduct(p.id);
      else await activateProduct(p.id);
      setSuccess(p.is_active ? 'Product deactivated' : 'Product activated');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setTogglingId(null);
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-sm text-cream-600">Manage catalog — includes inactive products.</p>
          </div>
          <Button variant="primary" size="md" onClick={openCreate}>
            Create Product
          </Button>
        </div>

        <div className="bg-white rounded-2xl border border-cream-200 p-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="product-search" className="sr-only">
              Search products
            </label>
            <input
              id="product-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or description"
              className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="text-sm text-cream-600 flex items-center">
            {loading ? 'Loading...' : `${products.length} product${products.length !== 1 ? 's' : ''}`}
          </div>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4" role="status">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4" role="alert">
            <p className="text-sm text-red-700">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={fetchData}>
              Retry
            </Button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-cream-200 p-6 flex gap-4">
                <Skeleton variant="rectangular" className="w-16 h-16 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="text" width="60%" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 && !error ? (
          <div className="bg-white rounded-2xl border border-cream-200 p-12 text-center">
            <p className="text-cream-600">No products found.</p>
            <p className="text-sm text-cream-500 mt-1">Try a different search or create a product.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-cream-50 border-b border-cream-200 text-left">
                    <th className="px-4 py-3 font-medium text-cream-600">Product</th>
                    <th className="px-4 py-3 font-medium text-cream-600">Category</th>
                    <th className="px-4 py-3 font-medium text-cream-600">Price</th>
                    <th className="px-4 py-3 font-medium text-cream-600">Stock</th>
                    <th className="px-4 py-3 font-medium text-cream-600">Status</th>
                    <th className="px-4 py-3 font-medium text-cream-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const cat = categories.find((c) => c.id === p.category_id);
                    return (
                      <tr key={p.id} className="border-b border-cream-100 last:border-0 hover:bg-cream-50/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {p.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-xl object-cover bg-cream-100" />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-cream-100 flex items-center justify-center text-cream-400 text-xs">No img</div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900 line-clamp-1">{p.name}</p>
                              <p className="text-xs text-cream-500">ID {p.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-cream-600">{cat?.name ?? `#${p.category_id}`}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {formatNGN(p.price)}
                          {p.cost_price && <span className="text-xs text-cream-500 block">Cost {formatNGN(p.cost_price)}</span>}
                        </td>
                        <td className="px-4 py-3">{(p as unknown as { stock_quantity: number }).stock_quantity ?? 0}</td>
                        <td className="px-4 py-3">
                          <Badge variant={p.is_active ? 'success' : 'danger'} size="sm">
                            {p.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                              Edit
                            </Button>
                            <Button
                              variant={p.is_active ? 'ghost' : 'primary'}
                              size="sm"
                              onClick={() => handleToggleActive(p)}
                              disabled={togglingId === p.id}
                              loading={togglingId === p.id}
                              className={p.is_active ? 'text-amber-700 hover:bg-amber-50' : ''}
                            >
                              {p.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => !submitting && setShowForm(false)} aria-hidden="true" />
            <div className="relative bg-white rounded-2xl border border-cream-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-xl font-bold text-gray-900">{editing ? 'Edit Product' : 'Create Product'}</h2>
              <p className="text-sm text-cream-600 mt-1">{editing ? 'Update fields supported by backend.' : 'Stock is set on creation; use Inventory to adjust later.'}</p>

              {formError && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3" role="alert">
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="prod-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    id="prod-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    maxLength={150}
                    className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label htmlFor="prod-desc" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="prod-desc"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    maxLength={2000}
                    className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="prod-category" className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      id="prod-category"
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="prod-price" className="block text-sm font-medium text-gray-700 mb-1">
                      Price (NGN) *
                    </label>
                    <input
                      id="prod-price"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="prod-cost" className="block text-sm font-medium text-gray-700 mb-1">
                      Cost Price (NGN)
                    </label>
                    <input
                      id="prod-cost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cost_price}
                      onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  {!editing && (
                    <div>
                      <label htmlFor="prod-stock" className="block text-sm font-medium text-gray-700 mb-1">
                        Stock Quantity
                      </label>
                      <input
                        id="prod-stock"
                        type="number"
                        step="1"
                        min="0"
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label htmlFor="prod-image" className="block text-sm font-medium text-gray-700 mb-1">
                      Product Image
                    </label>
                    {(editing || formData.image_url) && (
                      <span className="text-xs font-medium text-cream-600">
                        {editing ? 'Replace Image' : 'Image URL'}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <label
                      htmlFor="prod-image"
                      className="inline-flex min-h-[48px] cursor-pointer items-center justify-center rounded-xl border border-dashed border-green-700 bg-green-50 px-4 py-3 text-sm font-bold text-green-800 transition hover:bg-green-100 focus-within:ring-2 focus-within:ring-green-500"
                    >
                      <span>{editing ? 'Upload New Image' : 'Upload Image'}</span>
                      <input
                        id="prod-image"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={handleImageSelect}
                        className="sr-only"
                      />
                    </label>

                    {(selectedImagePreview || formData.image_url) && (
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedImagePreview || formData.image_url}
                          alt="Product preview"
                          className="h-16 w-16 rounded-xl border border-cream-200 object-cover bg-cream-50"
                        />
                        <span className="text-xs text-cream-600">
                          {selectedImage ? selectedImage.name : 'Current image'}
                        </span>
                      </div>
                    )}
                  </div>

                  {uploading && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
                      Uploading image...
                    </div>
                  )}

                  {uploadError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                      {uploadError}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} disabled={submitting} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" loading={submitting} disabled={submitting} className="flex-1">
                    {editing ? 'Save Changes' : 'Create Product'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
