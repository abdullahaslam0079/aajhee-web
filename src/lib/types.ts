export type Channel = "all" | "online" | "inStore";

export type Paginated<T> = {
  count: number;
  page: number;
  page_size: number;
  results: T[];
  radius_km?: number | null;
};

export type Category = {
  id: number;
  name: string;
  slug?: string;
  parent_id?: number | null;
  sort_order?: number;
  is_active?: boolean;
};

export type CategoryTreeNode = Category & {
  children?: CategoryTreeNode[];
};

export type Offer = {
  id: number;
  business_id: number;
  business_name: string;
  category_id?: number;
  category_name?: string;
  branch_ids?: number[];
  offer_type: string;
  redemption_mode?: string;
  is_online: boolean;
  title: string;
  description?: string;
  detailed_description?: string;
  external_url?: string | null;
  external_url_label?: string | null;
  image_urls?: string[];
  discount_percent?: number | string;
  item_name?: string;
  included_items?: string[];
  original_price?: number | string | null;
  discounted_price?: number | string | null;
  is_active?: boolean;
  business_logo_url?: string | null;
  like_count?: number;
  is_liked?: boolean;
  view_count?: number;
  nearest_distance_km?: number | null;
  featured_branch?: { id: number; name: string } | null;
};

export type MapBranch = {
  id: number;
  business_id: number;
  business_name: string;
  category_id?: number;
  category_name?: string;
  name: string;
  latitude: number | string;
  longitude: number | string;
  formattedAddress?: string;
  highest_discount_percent?: number | string | null;
  business_logo_url?: string | null;
  highest_discount_offer?: {
    id: number;
    title: string;
    discount_percent?: number | string;
    image_urls?: string[];
    is_online?: boolean;
  } | null;
  distance_km?: number | null;
};

export type Address = {
  id: number | string;
  label?: string;
  street?: string;
  houseNumber?: string;
  house_number?: string;
  postalCode?: string;
  postal_code?: string;
  city?: string;
  county?: string;
  latitude?: number | string;
  longitude?: number | string;
  isDefault?: boolean;
  is_default?: boolean;
  formattedAddress?: string;
};

export type User = {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  phone?: string | null;
  account_type?: string;
};

export type AuthPayload = {
  access: string;
  refresh?: string;
  user?: User;
  business?: BusinessProfile;
  addresses?: Address[];
};

export type NotificationItem = {
  id: number;
  title?: string;
  body?: string;
  message?: string;
  is_read?: boolean;
  created_at?: string;
};

export type FavoritePayload = {
  offers?: Offer[];
  branches?: MapBranch[];
  businesses?: { id: number; name: string; logo?: string | null }[];
};

export type BusinessProfile = {
  id: number;
  name: string;
  email?: string;
  logo?: string | null;
  logo_url?: string | null;
  category?: Category | number;
  category_id?: number;
  category_ids?: number[];
  category_name?: string;
  presence_mode?: string;
  online_coverage?: string;
  verification_status?: "under_review" | "verified" | "suspended" | string;
  phone?: string;
  instagram_url?: string;
  cnic_image_url?: string | null;
  shop_photo_url?: string | null;
  notification_whatsapp?: string;
  is_paused?: boolean;
  is_customer_visible?: boolean;
  business_hours?: Record<
    string,
    { open?: string; close?: string; closed?: boolean }
  >;
  rating_avg?: string;
  rating_count?: number;
};

export type Branch = {
  id: number;
  name: string;
  street: string;
  house_number: string;
  postal_code: string;
  city: string;
  latitude: number | string;
  longitude: number | string;
  formatted_address?: string;
  formattedAddress?: string;
};

export type OrderStatus =
  | "pending"
  | "accepted"
  | "cancelled"
  | "awaiting_payment"
  | "payment_submitted"
  | "paid_confirmed"
  | "preparing"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "completed";

export type FulfillmentType = "pickup" | "local_same_day" | "nationwide";
export type PaymentMethod =
  | "cash_on_pickup"
  | "cash_on_delivery"
  | "bank_transfer"
  | "stripe"
  | "jazzcash";
export type ContactType = "whatsapp" | "phone" | "email";
export type CustomerCancelPolicy = "disabled" | "window_minutes";
export type PaymentProofReviewStatus = "pending" | "accepted" | "rejected";

export type BusinessStats = {
  total_orders: number;
  completed_orders: number;
  gmv: string;
  by_status: Array<{ status: OrderStatus; count: number }>;
  by_branch: Array<{
    branch_id: number;
    branch_name: string;
    gmv: string;
    order_count: number;
  }>;
  by_product: Array<{
    product_id: number | null;
    product_name: string | null;
    quantity: number;
    gmv: string;
  }>;
  product_count: number;
  active_product_count: number;
  low_stock_count?: number;
  low_stock_threshold?: number;
  rating_avg?: string;
  rating_count?: number;
};

export type ProductGalleryImage = {
  id: number;
  image_url: string | null;
  source_url?: string;
  sort_order: number;
};

export type Product = {
  id: number;
  business_id?: number;
  business_name?: string;
  category_id: number;
  category_name?: string;
  branch_ids?: number[];
  name: string;
  description?: string;
  detailed_description?: string;
  image_url?: string | null;
  gallery?: ProductGalleryImage[];
  base_price: string;
  discount_percent?: string | null;
  sale_price?: string | null;
  has_discount?: boolean;
  effective_price?: string;
  effective_discount_percent?: string;
  is_available?: boolean;
  is_enabled?: boolean;
  stock_quantity?: number | null;
  is_low_stock?: boolean;
  sort_order?: number;
  view_count?: number;
  like_count?: number;
  order_count?: number;
  rating_avg?: string;
  rating_count?: number;
  created_at?: string;
  updated_at?: string;
};

export type ProductReviewImage = {
  id: number;
  image_url: string | null;
  sort_order: number;
};

export type ProductReview = {
  id: number;
  product_id: number;
  product_name: string;
  business_id: number;
  business_name: string;
  order_public_id: string;
  order_item_id: number;
  rating: number;
  comment: string;
  status: "published" | "hidden" | "flagged" | string;
  images: ProductReviewImage[];
  user_display_name: string;
  merchant_reply: string;
  merchant_replied_at: string | null;
  flagged_at: string | null;
  flag_reason: string;
  verified_purchase: boolean;
  can_edit: boolean;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BranchContact = {
  id?: number;
  contact_type: ContactType;
  value: string;
  is_primary?: boolean;
};

export type BranchFulfillmentSettings = {
  pickup_enabled: boolean;
  pickup_radius_km: string;
  same_day_enabled: boolean;
  same_day_fee: string;
  same_day_max_delivery_hours: number;
  same_day_radius_km?: string;
  same_day_areas?: string;
  nationwide_enabled: boolean;
  nationwide_delivery_fee: string;
  nationwide_max_delivery_hours: number;
  customer_cancel_policy: CustomerCancelPolicy;
  customer_cancel_window_minutes: number;
  bank_transfer_enabled: boolean;
  bank_transfer_instructions: string;
  stripe_enabled: boolean;
  stripe_instructions: string;
  jazzcash_enabled: boolean;
  jazzcash_instructions: string;
  easypaisa_enabled?: boolean;
  easypaisa_instructions?: string;
  cash_on_pickup_enabled: boolean;
  cash_on_delivery_enabled: boolean;
  updated_at?: string;
};

export type OrderItem = {
  id: number;
  product_id: number | null;
  product_name: string;
  unit_base_price: string;
  unit_sale_price: string | null;
  unit_discount_percent: string;
  quantity: number;
  line_total: string;
};

export type OrderPaymentProof = {
  id: number;
  file_url: string | null;
  note: string;
  submitted_at: string;
  review_status: PaymentProofReviewStatus;
  reviewed_at: string | null;
  review_note: string;
};

export type OrderDeliverySnapshot = {
  fulfillment_type: FulfillmentType;
  delivery_fee: string;
  max_delivery_hours: number;
  promised_by: string | null;
  branch_city_name?: string;
  customer_city_name?: string;
};

export type PaymentStatus = "unpaid" | "awaiting_confirmation" | "paid";

export type BusinessOrder = {
  id: number;
  public_id: string;
  business_id: number;
  business_name: string;
  branch_id: number;
  branch_name: string;
  status: OrderStatus;
  payment_status?: PaymentStatus | string;
  fulfillment_type: FulfillmentType;
  payment_method: PaymentMethod;
  subtotal: string;
  delivery_fee: string;
  total: string;
  delivery_address_text: string;
  delivery_house_number?: string;
  delivery_landmark?: string;
  customer_notes: string;
  customer_name?: string;
  customer_phone?: string | null;
  customer_email?: string | null;
  customer_cancel_allowed?: boolean;
  customer_cancel_until?: string | null;
  can_customer_cancel?: boolean;
  cancelled_by?: string;
  cancel_reason?: string;
  cancelled_at?: string | null;
  placed_at: string;
  updated_at: string;
  items: OrderItem[];
  delivery_snapshot?: OrderDeliverySnapshot | null;
  payment_proofs: OrderPaymentProof[];
  bank_transfer_instructions?: string;
  payment_instructions?: string;
};

export type BusinessNotification = {
  id: number;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  is_read?: boolean;
  read_at?: string | null;
  created_at: string;
};

export type BranchStat = {
  branch_id: number;
  branch_name: string;
  scan_count: number;
  avail_count: number;
};

export type BusinessOffer = Offer & {
  is_enabled?: boolean;
  qr_code?: string;
  usage_limit_type?: string;
  usage_limit_count?: number;
  is_time_limited?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at?: string;
  branches?: Branch[];
  branch_stats?: BranchStat[];
};
