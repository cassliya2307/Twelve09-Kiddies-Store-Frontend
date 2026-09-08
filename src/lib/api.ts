const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'An error occurred' }));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);

// Categories
export const getCategories = () => api.get<Category[]>('/categories');
export const createCategory = (data: { name: string; description?: string | null }) => api.post<Category>('/categories', data);

// Products
export interface GetProductsParams {
  skip?: number;
  limit?: number;
  include_inactive?: boolean;
  search?: string;
}

export const getProducts = (params?: GetProductsParams) => {
  const searchParams = new URLSearchParams();
  if (params?.skip) searchParams.set('skip', params.skip.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.include_inactive) searchParams.set('include_inactive', 'true');
  if (params?.search) {
    const trimmed = params.search.trim();
    if (trimmed) searchParams.set('search', trimmed);
  }
  const query = searchParams.toString();
  return api.get<ProductListItem[]>(`/products${query ? `?${query}` : ''}`);
};

export const getProduct = (id: number) => api.get<Product>(`/products/${id}`);
export const createProduct = (data: ProductCreate) => api.post<Product>(`/products`, data);
export const updateProduct = (id: number, data: ProductUpdate) => api.put<Product>(`/products/${id}`, data);
export const activateProduct = (id: number) => api.patch<Product>(`/products/${id}/activate`, {});
export const deactivateProduct = (id: number) => api.patch<Product>(`/products/${id}/deactivate`, {});
export const updateProductStock = (id: number, quantity: number) => api.patch<Product>(`/products/${id}/stock`, { quantity });

// Health
export const getHealth = () => api.get<HealthResponse>('/health');

// Addresses
export const getAddresses = () => api.get<Address[]>('/addresses');
export const getAddress = (id: number) => api.get<Address>(`/addresses/${id}`);
export const createAddress = (data: AddressCreate) => api.post<Address>('/addresses', data);
// Backend uses PUT for updates (PATCH is not defined); provide PUT-based update
export const updateAddress = (id: number, data: AddressUpdate) => api.put<Address>(`/addresses/${id}`, data);
export const deleteAddress = (id: number) => api.delete(`/addresses/${id}`);
export const setDefaultAddress = (id: number) => api.patch<Address>(`/addresses/${id}/default`, {});

// Checkout
export const validateCheckout = (data: CheckoutRequest) =>
  api.post<CheckoutValidationResponse>('/checkout/validate', data);
export const createCheckout = (data: CheckoutRequest) => api.post<Order>('/checkout', data);

// Orders
export const getOrders = () => api.get<Order[]>('/orders');
export const getOrder = (id: number) => api.get<Order>(`/orders/${id}`);
export const createOrder = (data: OrderCreate) => api.post<Order>('/orders', data);
export const cancelOrder = (id: number) => api.post<Order>(`/orders/${id}/cancel`, {});
export const updateOrderStatus = (id: number, status: Order['status']) =>
  api.patch<Order>(`/orders/${id}/status`, { status });

// Payments
export const createPayment = (data: PaymentCreate) => api.post<Payment>('/payments', data);
export const getPayments = () => api.get<Payment[]>('/payments');
export const getPayment = (id: number) => api.get<Payment>(`/payments/${id}`);
export const getPaymentForOrder = (orderId: number) => api.get<Payment | null>(`/orders/${orderId}/payments`);
export const updatePaymentStatus = (id: number, data: PaymentStatusUpdate) =>
  api.patch<Payment>(`/payments/${id}/status`, data);

// Paystack
export const initializePaystackPayment = (data: PaystackInitializeRequest) =>
  api.post<PaystackInitializeResponse>('/payments/paystack/initialize', data);

// Admin dashboard
export const getAdminDashboard = (days: number = 30) => api.get<DashboardResponse>(`/admin/dashboard?days=${days}`);

// Delivery fee (Admin-only)
export const getDeliveryFee = () => api.get<DeliveryFeeRead>(`/admin/delivery-fee`);
export const updateDeliveryFee = (data: DeliveryFeeUpdate) => api.patch<DeliveryFeeRead>(`/admin/delivery-fee`, data);

// Expenses
export const getExpenses = () => api.get<Expense[]>(`/expenses`);
export const createExpense = (data: ExpenseCreate) => api.post<Expense>(`/expenses`, data);
export const updateExpense = (id: number, data: ExpenseCreate) => api.patch<Expense>(`/expenses/${id}`, data);
export const deleteExpense = (id: number) => api.delete(`/expenses/${id}`);

// Admin users
export interface GetAdminUsersParams {
  role?: string;
  is_active?: boolean;
  search?: string;
  skip?: number;
  limit?: number;
}
export const getAdminUsers = (params?: GetAdminUsersParams) => {
  const searchParams = new URLSearchParams();
  if (params?.role) searchParams.set('role', params.role);
  if (params?.is_active !== undefined) searchParams.set('is_active', String(params.is_active));
  if (params?.search) {
    const trimmed = params.search.trim();
    if (trimmed) searchParams.set('search', trimmed);
  }
  if (params?.skip) searchParams.set('skip', params.skip.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  const query = searchParams.toString();
  return api.get<User[]>(`/admin/users${query ? `?${query}` : ''}`);
};
export const updateUserRole = (id: number, data: { role?: string; is_active?: boolean }) =>
  api.patch<User>(`/admin/users/${id}/role`, data);
export const updateUserPermissions = (id: number, permissions: string[]) =>
  api.patch<User>(`/admin/users/${id}/permissions`, permissions);

// Auth
export const login = (data: LoginRequest) => api.post<AuthTokens>('/auth/login', data);
export const register = (data: RegisterRequest) => api.post<User>('/auth/register', data);
export const getCurrentUser = () => api.get<User>('/auth/me');

import type {
  Category,
  Product,
  ProductListItem,
  ProductCreate,
  ProductUpdate,
  HealthResponse,
  Address,
  AddressCreate,
  AddressUpdate,
  CheckoutRequest,
  CheckoutValidationResponse,
  Order,
  OrderCreate,
  Payment,
  PaymentCreate,
  PaymentStatusUpdate,
  User,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  PaystackInitializeRequest,
  PaystackInitializeResponse,
  DashboardResponse,
  Expense,
  ExpenseCreate,
  DeliveryFeeRead,
  DeliveryFeeUpdate,
} from '@/types/api';