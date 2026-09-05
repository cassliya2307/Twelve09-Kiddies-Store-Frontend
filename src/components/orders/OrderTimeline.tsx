'use client';

import { getOrderStatusView } from '@/lib/statusLabels';
import { formatDate } from '@/lib/format';
import type { Order } from '@/types/api';

interface TimelineStep {
  key: string;
  label: string;
  description: string;
}

function getStepsForFulfillment(fulfillmentMethod: string | null | undefined): TimelineStep[] {
  const isPickup = fulfillmentMethod === 'STORE_PICKUP';
  if (isPickup) {
    return [
      { key: 'PENDING', label: getOrderStatusView('PENDING').label, description: 'We received your order' },
      { key: 'CONFIRMED', label: getOrderStatusView('CONFIRMED').label, description: 'Order confirmed and ready for processing' },
      { key: 'PROCESSING', label: getOrderStatusView('PROCESSING').label, description: 'Preparing your items for pickup' },
      { key: 'READY_FOR_PICKUP', label: getOrderStatusView('READY_FOR_PICKUP').label, description: 'Ready for collection at the store' },
      { key: 'COMPLETED', label: getOrderStatusView('COMPLETED').label, description: 'Order collected' },
    ];
  }
  // STORE_DELIVERY and CUSTOMER_DISPATCH share same flow
  return [
    { key: 'PENDING', label: getOrderStatusView('PENDING').label, description: 'We received your order' },
    { key: 'CONFIRMED', label: getOrderStatusView('CONFIRMED').label, description: 'Order confirmed' },
    { key: 'PROCESSING', label: getOrderStatusView('PROCESSING').label, description: 'Packing your items' },
    { key: 'OUT_FOR_DELIVERY', label: getOrderStatusView('OUT_FOR_DELIVERY').label, description: 'On the way to you' },
    { key: 'COMPLETED', label: getOrderStatusView('COMPLETED').label, description: 'Delivered' },
  ];
}

type StepState = 'completed' | 'current' | 'upcoming' | 'cancelled';

interface OrderTimelineProps {
  order: Order;
}

export function OrderTimeline({ order }: OrderTimelineProps) {
  const status = order.status;
  const fulfillment = order.fulfillment_method;
  const isCancelled = status === 'CANCELLED';

  if (isCancelled) {
    // For cancelled orders, we cannot reconstruct history. Show honest 2-step timeline using only data we have.
    // created_at = order placed, updated_at = last status change (cancellation)
    return (
      <section
        className="bg-white rounded-2xl border border-cream-200 p-6"
        aria-labelledby="order-timeline-heading"
      >
        <h2 id="order-timeline-heading" className="text-xl font-bold text-gray-900 mb-1">
          Order Timeline
        </h2>
        <p className="text-sm text-cream-600 mb-6">
          Fulfillment: <span className="font-medium text-gray-700">{fulfillment?.replace(/_/g, ' ') ?? '—'}</span>
          <span className="sr-only">Current status: {getOrderStatusView(status).label}</span>
        </p>
        <p className="sr-only" aria-live="polite">
          Order status: {getOrderStatusView(status).label}. This order was cancelled.
        </p>

        <ol className="relative border-l-2 border-cream-200 ml-3 space-y-0" aria-label="Order progress, cancelled">
          {/* Pending - completed */}
          <li className="relative pl-8 pb-8">
            <span className="absolute -left-[9px] top-0 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-green-600 ring-4 ring-white" aria-hidden="true">
              <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {getOrderStatusView('PENDING').label}{' '}
                <span className="font-normal text-green-700">(Completed)</span>
              </p>
              <p className="text-sm text-cream-600">We received your order</p>
              {order.created_at && (
                <p className="mt-1 text-xs text-cream-500">{formatDate(order.created_at)}</p>
              )}
            </div>
          </li>

          {/* Cancelled - current */}
          <li className="relative pl-8" aria-current="step">
            <span className="absolute -left-[9px] top-0 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-red-600 ring-4 ring-white" aria-hidden="true">
              <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-red-700">
                {getOrderStatusView('CANCELLED').label}{' '}
                <span className="font-normal text-red-600">(Cancelled)</span>
              </p>
              <p className="text-sm text-cream-600">This order was cancelled and will not proceed.</p>
              {order.updated_at && (
                <p className="mt-1 text-xs text-cream-500">Last updated: {formatDate(order.updated_at)}</p>
              )}
            </div>
          </li>
        </ol>

        <div className="mt-6 rounded-xl bg-red-50 border border-red-200 p-4" role="status">
          <p className="text-sm font-medium text-red-800">Order cancelled</p>
          <p className="mt-1 text-sm text-red-700">
            No further stages will occur. If you paid for this order, contact support for assistance.
          </p>
        </div>
      </section>
    );
  }

  const steps = getStepsForFulfillment(fulfillment);
  const currentIndex = steps.findIndex(s => s.key === status);
  // If status not in linear flow (edge), treat as last known
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <section
      className="bg-white rounded-2xl border border-cream-200 p-6"
      aria-labelledby="order-timeline-heading"
    >
      <h2 id="order-timeline-heading" className="text-xl font-bold text-gray-900 mb-1">
        Order Timeline
      </h2>
      <p className="text-sm text-cream-600 mb-2">
        Fulfillment: <span className="font-medium text-gray-700">{fulfillment?.replace(/_/g, ' ') ?? '—'}</span>
      </p>
      <p className="sr-only" aria-live="polite">
        Order status: {getOrderStatusView(status).label}. Step {safeIndex + 1} of {steps.length}.
      </p>
      <p className="text-sm text-cream-500 mb-6" aria-hidden="true">
        Current: <span className="font-semibold text-gray-900">{getOrderStatusView(status).label}</span>
      </p>

      <ol className="relative border-l-2 border-cream-200 ml-3" aria-label="Order progress">
        {steps.map((step, idx) => {
          let state: StepState = 'upcoming';
          if (idx < safeIndex) state = 'completed';
          else if (idx === safeIndex) state = 'current';
          else state = 'upcoming';

          const isLast = idx === steps.length - 1;

          return (
            <li
              key={step.key}
              className={`relative pl-8 ${!isLast ? 'pb-8' : ''}`}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              {/* Connector is the left border; dot sits on it */}
              {state === 'completed' && (
                <span
                  className="absolute -left-[9px] top-0 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-green-600 ring-4 ring-white"
                  aria-hidden="true"
                >
                  <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
              {state === 'current' && (
                <span
                  className="absolute -left-[9px] top-0 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-green-600 ring-4 ring-green-100 border-2 border-white"
                  aria-hidden="true"
                >
                  <span className="h-2 w-2 rounded-full bg-white" />
                </span>
              )}
              {state === 'upcoming' && (
                <span
                  className="absolute -left-[9px] top-0 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white border-2 border-cream-300 ring-4 ring-white"
                  aria-hidden="true"
                />
              )}

              <div>
                <p
                  className={`text-sm font-semibold ${
                    state === 'completed' ? 'text-gray-900' : state === 'current' ? 'text-green-700' : 'text-gray-500'
                  }`}
                >
                  {step.label}{' '}
                  <span className="font-normal text-xs">
                    {state === 'completed' && <span className="text-green-700">— Completed</span>}
                    {state === 'current' && <span className="text-green-700">— Current</span>}
                    {state === 'upcoming' && <span className="text-cream-500">— Upcoming</span>}
                  </span>
                </p>
                <p className={`text-sm ${state === 'upcoming' ? 'text-cream-400' : 'text-cream-600'}`}>
                  {step.description}
                </p>
                {state === 'current' && order.updated_at && (
                  <p className="mt-1 text-xs text-cream-500">Last updated: {formatDate(order.updated_at)}</p>
                )}
                {state === 'completed' && idx === 0 && order.created_at && (
                  <p className="mt-1 text-xs text-cream-500">Placed: {formatDate(order.created_at)}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Helpful contextual note using only backend data */}
      <div className="mt-6 rounded-xl bg-cream-50 border border-cream-200 p-4">
        <p className="text-sm text-cream-700">
          {status === 'PENDING' && 'Your order is awaiting confirmation.'}
          {status === 'CONFIRMED' && 'Your order has been confirmed. We will start processing shortly.'}
          {status === 'PROCESSING' && fulfillment === 'STORE_PICKUP' && 'We are preparing your items for pickup. You will be notified when ready.'}
          {status === 'PROCESSING' && fulfillment !== 'STORE_PICKUP' && 'We are preparing your items for delivery.'}
          {status === 'READY_FOR_PICKUP' && 'Your order is ready for pickup at the store.'}
          {status === 'OUT_FOR_DELIVERY' && 'Your order is out for delivery.'}
          {status === 'COMPLETED' && 'This order has been completed. Thank you for shopping with us!'}
        </p>
        {(order.created_at || order.updated_at) && (
          <p className="mt-2 text-xs text-cream-500">
            {order.created_at && <>Placed: {formatDate(order.created_at)}</>}
            {order.created_at && order.updated_at && ' • '}
            {order.updated_at && <>Last updated: {formatDate(order.updated_at)}</>}
          </p>
        )}
      </div>
    </section>
  );
}
