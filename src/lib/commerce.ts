import type { BusinessOrder, FulfillmentType, OrderStatus, PaymentMethod } from "./types";

export const BUSINESS_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["accepted", "cancelled"],
  accepted: [
    "awaiting_payment",
    "preparing",
    "ready_for_pickup",
    "out_for_delivery",
    "cancelled",
  ],
  awaiting_payment: ["payment_submitted", "cancelled"],
  payment_submitted: ["paid_confirmed", "awaiting_payment", "cancelled"],
  paid_confirmed: [
    "preparing",
    "ready_for_pickup",
    "out_for_delivery",
    "cancelled",
  ],
  preparing: ["ready_for_pickup", "out_for_delivery", "cancelled"],
  ready_for_pickup: ["completed", "cancelled"],
  out_for_delivery: ["completed", "cancelled"],
  cancelled: [],
  completed: [],
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  cancelled: "Cancelled",
  awaiting_payment: "Awaiting payment",
  payment_submitted: "Payment submitted",
  paid_confirmed: "Paid confirmed",
  preparing: "Preparing",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  completed: "Delivered",
};

export const STATUS_ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  accepted: "Accept order",
  cancelled: "Cancel",
  awaiting_payment: "Request payment",
  preparing: "Start preparing",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  completed: "Mark delivered",
  paid_confirmed: "Confirm paid",
  payment_submitted: "Mark payment submitted",
};

export const FULFILLMENT_LABELS: Record<string, string> = {
  pickup: "In-store pickup",
  local_same_day: "Same-day delivery",
  nationwide: "Nationwide / standard delivery",
};

export const PAYMENT_LABELS: Record<string, string> = {
  cash_on_pickup: "Cash on pickup",
  cash_on_delivery: "Cash on delivery",
  bank_transfer: "Bank transfer",
  stripe: "Card",
  jazzcash: "Mobile wallet (JazzCash / Easypaisa)",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: "Unpaid",
  awaiting_confirmation: "Awaiting confirmation",
  paid: "Paid",
};

/** Methods where the customer uploads a transaction screenshot at checkout. */
export const PAYMENT_PROOF_METHODS = new Set<string>([
  "bank_transfer",
  "stripe",
  "jazzcash",
]);

export function requiresPaymentProof(method?: string | null): boolean {
  return Boolean(method && PAYMENT_PROOF_METHODS.has(method));
}

export function statusTone(
  status: string,
): "neutral" | "success" | "warning" | "danger" | "deal" {
  switch (status) {
    case "completed":
    case "paid_confirmed":
      return "success";
    case "cancelled":
      return "danger";
    case "pending":
    case "awaiting_payment":
    case "payment_submitted":
      return "warning";
    case "preparing":
    case "ready_for_pickup":
    case "out_for_delivery":
    case "accepted":
      return "deal";
    default:
      return "neutral";
  }
}

export function labelStatus(status: string) {
  return STATUS_LABELS[status as OrderStatus] || status.replaceAll("_", " ");
}

export function labelPaymentStatus(status?: string | null) {
  if (!status) return "—";
  return PAYMENT_STATUS_LABELS[status] || status.replaceAll("_", " ");
}

export function labelFulfillment(value: string, city?: string | null) {
  if (value === "local_same_day") {
    const cleaned = (city || "").trim();
    if (cleaned) return `Same-day delivery in ${cleaned}`;
  }
  return FULFILLMENT_LABELS[value] || value.replaceAll("_", " ");
}

export function labelPayment(value: string) {
  return PAYMENT_LABELS[value] || value.replaceAll("_", " ");
}

export function isPickupFulfillment(fulfillment?: FulfillmentType | string) {
  return fulfillment === "pickup";
}

export function isDeliveryFulfillment(fulfillment?: FulfillmentType | string) {
  return fulfillment === "local_same_day" || fulfillment === "nationwide";
}

/** Merchant actions allowed for this order (mirrors backend rules). */
export function nextActions(order: {
  status: OrderStatus;
  fulfillment_type?: FulfillmentType | string;
  payment_method?: PaymentMethod | string;
  payment_status?: string | null;
}): OrderStatus[] {
  let actions = [...(BUSINESS_STATUS_TRANSITIONS[order.status] || [])];

  // Customer uploads proof — merchants don't mark payment_submitted
  actions = actions.filter((s) => s !== "payment_submitted");

  if (
    order.status === "accepted" ||
    order.status === "paid_confirmed" ||
    order.status === "preparing"
  ) {
    if (isPickupFulfillment(order.fulfillment_type)) {
      actions = actions.filter((s) => s !== "out_for_delivery");
    } else if (isDeliveryFulfillment(order.fulfillment_type)) {
      actions = actions.filter((s) => s !== "ready_for_pickup");
    }
  }

  if (order.status === "accepted") {
    if (requiresPaymentProof(order.payment_method)) {
      if (order.payment_status !== "paid") {
        actions = actions.filter(
          (s) =>
            s !== "preparing" &&
            s !== "ready_for_pickup" &&
            s !== "out_for_delivery",
        );
      }
      actions = actions.filter((s) => s !== "awaiting_payment");
    } else {
      actions = actions.filter((s) => s !== "awaiting_payment");
    }
  }

  return actions;
}

export function nextActionsForOrder(
  order: Pick<
    BusinessOrder,
    "status" | "fulfillment_type" | "payment_method" | "payment_status"
  >,
) {
  return nextActions(order);
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
