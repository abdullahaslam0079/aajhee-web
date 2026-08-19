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
  category?: Category | number;
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
