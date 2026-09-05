export interface Category {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string;
  cost_price: string | null;
  category_id: number;
  stock_quantity: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  category?: Category;
}

export interface ProductListItem {
  id: number;
  name: string;
  description: string | null;
  price: string;
  cost_price: string | null;
  image_url: string | null;
  is_active: boolean;
  stock_quantity: number;
  category_id: number;
  created_at: string | null;
}

export interface HealthResponse {
  status: string;
  message: string;
}

export interface ApiError {
  detail: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

// Address types
export interface Address {
  id: number;
  user_id: number;
  recipient_name: string;
  phone_number: string;
  address_line: string;
  city: string;
  state: string;
  additional_directions: string | null;
  is_default: boolean;
}

export interface AddressCreate {
  recipient_name: string;
  phone_number: string;
  address_line: string;
  city: string;
  state: string;
  additional_directions?: string | null;
  is_default?: boolean;
}

export interface AddressUpdate {
  recipient_name?: string;
  phone_number?: string;
  address_line?: string;
  city?: string;
  state?: string;
  additional_directions?: string | null;
  is_default?: boolean;
}

// Checkout types
export interface CartItemInput {
  product_id: number;
  quantity: number;
}

export interface CartItemDetails {
  product_id: number;
  quantity: number;
  product_name: string;
  unit_price: number;
  subtotal: number;
}

export interface CheckoutRequest {
  items: CartItemInput[];
  fulfillment_method: 'STORE_DELIVERY' | 'CUSTOMER_DISPATCH' | 'STORE_PICKUP';
  address_id?: number | null;
  delivery_recipient_name?: string | null;
  delivery_phone_number?: string | null;
  delivery_address_line?: string | null;
  delivery_city?: string | null;
  delivery_state?: string | null;
  delivery_additional_directions?: string | null;
}

export interface CheckoutSummary {
  items: CartItemDetails[];
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  fulfillment_method: string;
  delivery_address: {
    id: number;
    recipient_name: string;
    phone_number: string;
    address_line: string;
    city: string;
    state: string;
  } | null;
}

export interface CheckoutValidationResponse {
  valid: boolean;
  message: string;
  summary: CheckoutSummary | null;
  errors: string[] | null;
}

// Order types
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'COMPLETED' | 'CANCELLED';

export type FulfillmentMethod = 'STORE_DELIVERY' | 'CUSTOMER_DISPATCH' | 'STORE_PICKUP';

export interface OrderItemRead {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  image_url: string | null;
}

export interface Order {
  id: number;
  user_id: number;
  address_id: number | null;
  total_amount: number;
  subtotal: number;
  status: OrderStatus;
  fulfillment_method: FulfillmentMethod;
  delivery_fee: number;
  delivery_recipient_name: string | null;
  delivery_phone_number: string | null;
  delivery_address_line: string | null;
  delivery_city: string | null;
  delivery_state: string | null;
  delivery_additional_directions: string | null;
  order_items: OrderItemRead[];
  created_at: string | null;
  updated_at: string | null;
}

export interface OrderCreate {
  fulfillment_method: FulfillmentMethod;
  address_id?: number | null;
  delivery_recipient_name?: string | null;
  delivery_phone_number?: string | null;
  delivery_address_line?: string | null;
  delivery_city?: string | null;
  delivery_state?: string | null;
  delivery_additional_directions?: string | null;
  items: { product_id: number; quantity: number }[];
}

// Payment types
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface PaymentCreate {
  order_id: number;
  payment_method: string;
  transaction_reference?: string | null;
  provider?: string | null;
  provider_reference?: string | null;
  payment_metadata?: Record<string, unknown> | null;
}

export interface Payment {
  id: number;
  order_id: number;
  amount: number;
  status: PaymentStatus;
  payment_method: string;
  provider?: string | null;
  provider_reference?: string | null;
  transaction_reference?: string | null;
  payment_metadata?: Record<string, unknown> | null;
  paid_at?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PaymentStatusUpdate {
  status: PaymentStatus;
}

// Paystack types
export interface PaystackInitializeRequest {
  order_id: number;
  callback_url?: string | null;
}

export interface PaystackInitializeResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaystackTransactionVerification {
  id: number;
  domain: string;
  status: string;
  reference: string;
  amount: number;
  message: string | null;
  gateway_response: string;
  paid_at: string;
  created_at: string;
  channel: string;
  currency: string;
  ip_address: string | null;
  metadata: Record<string, unknown>;
  log: Record<string, unknown> | null;
  fees: number;
  fees_split: Record<string, unknown> | null;
  authorization: {
    authorization_code: string;
    bin: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    channel: string;
    card_type: string;
    bank: string;
    country_code: string;
    brand: string;
    reusable: boolean;
    signature: string;
    account_name: string | null;
  } | null;
  customer: {
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string;
    customer_code: string;
    phone: string | null;
    metadata: Record<string, unknown>;
    risk_action: string;
  };
  plan: Record<string, unknown> | null;
  subaccount: Record<string, unknown> | null;
  split: Record<string, unknown> | null;
  order_id: string | null;
  requested_amount: number;
  pos_transaction_data: Record<string, unknown> | null;
  source: Record<string, unknown> | null;
  fees_breakdown: Record<string, unknown> | null;
}

// Auth types
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  permissions: string[];
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}