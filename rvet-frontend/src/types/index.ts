// Vendor Types
export interface Vendor {
  _id: string;
  name: string;
  email: string;
  shop_name: string;
  is_admin?: boolean;
}

export interface VendorRegisterData {
  name: string;
  email: string;
  password: string;
  shop_name: string;
}

export interface VendorLoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  vendor: Vendor;
}

// Category Types
export interface Category {
  _id: string;
  name: string;
}

// Product Types
export interface Product {
  _id: string;
  vendor_id: Vendor | string;
  name: string;
  category_id: Category;
  price: number;
  quantity: number;
  expiry_date: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductFormData {
  name: string;
  category_id: string;
  price: number | string;
  quantity: number | string;
  expiry_date: string;
}

// Stats Types
export interface VendorStats {
  totalProducts: number;
  expiringItems: number;
  outOfStockItems: number;
}

/** Vendors that currently list catalog-visible products (for filters) */
export interface CatalogVendor {
  _id: string;
  shop_name: string;
}

// Catalog Filter Types
export interface CatalogFilters {
  category?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  /** Vendor (store) id */
  vendor?: string;
  /**
   * `newest` | `store` | `price_asc` | `price_desc` | `name`
   */
  sort?: string;
}

// Expiry Status Types
export type ExpiryStatus = "none" | "safe" | "warning" | "critical" | "expired";

// Admin Types
export interface WhitelistEntry {
  id: number;
  full_name: string;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
}

export interface AdminVendor {
  id: string;
  name: string;
  email: string;
  shop_name: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}
