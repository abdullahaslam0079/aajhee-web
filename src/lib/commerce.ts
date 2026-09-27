import type { OrderStatus } from "./types";

export const BUSINESS_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["awaiting_payment", "preparing", "cancelled"],
  awaiting_payment: ["payment_submitted", "cancelled"],
  payment_submitted: ["paid_confirmed", "awaiting_payment", "cancelled"],
  paid_confirmed: ["preparing", "cancelled"],
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
  paid_confirmed: "Paid",
  preparing: "Preparing",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
};

export const STATUS_ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  accepted: "Accept order",
  cancelled: "Cancel",
  awaiting_payment: "Request bank transfer",
  preparing: "Start preparing",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  completed: "Mark completed",
  paid_confirmed: "Confirm paid",
  payment_submitted: "Mark payment submitted",
};

export const FULFILLMENT_LABELS: Record<string, string> = {
  pickup: "Pickup",
  local_same_day: "Local delivery",
  nationwide: "Nationwide",
};

export const PAYMENT_LABELS: Record<string, string> = {
  cash_on_pickup: "Cash on pickup",
  cash_on_delivery: "Cash on delivery",
  bank_transfer: "Bank transfer",
  stripe: "Card",
  jazzcash: "JazzCash",
};

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

export function labelFulfillment(value: string) {
  return FULFILLMENT_LABELS[value] || value.replaceAll("_", " ");
}

export function labelPayment(value: string) {
  return PAYMENT_LABELS[value] || value.replaceAll("_", " ");
}

export function nextActions(status: OrderStatus): OrderStatus[] {
  return BUSINESS_STATUS_TRANSITIONS[status] || [];
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
