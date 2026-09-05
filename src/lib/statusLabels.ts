type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface StatusView {
  label: string;
  variant: BadgeVariant;
}

const orderStatusMap: Record<string, StatusView> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  CONFIRMED: { label: 'Confirmed', variant: 'info' },
  PROCESSING: { label: 'Processing', variant: 'info' },
  READY_FOR_PICKUP: { label: 'Ready for Pickup', variant: 'info' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', variant: 'info' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'danger' },
};

const paymentStatusMap: Record<string, StatusView> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  SUCCESS: { label: 'Paid', variant: 'success' },
  FAILED: { label: 'Failed', variant: 'danger' },
  REFUNDED: { label: 'Refunded', variant: 'info' },
};

const fulfillmentMap: Record<string, string> = {
  STORE_DELIVERY: 'Store Delivery',
  CUSTOMER_DISPATCH: 'Customer Dispatch',
  STORE_PICKUP: 'Store Pickup',
};

export function getOrderStatusView(status: string | null | undefined): StatusView {
  if (!status) return { label: 'Unknown', variant: 'default' };
  return orderStatusMap[status] ?? { label: status, variant: 'default' };
}

export function getPaymentStatusView(status: string | null | undefined): StatusView {
  if (!status) return { label: 'Unknown', variant: 'default' };
  return paymentStatusMap[status] ?? { label: status, variant: 'default' };
}

export function getFulfillmentLabel(method: string | null | undefined): string {
  if (!method) return '—';
  return fulfillmentMap[method] ?? method;
}
