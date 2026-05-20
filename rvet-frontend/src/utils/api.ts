import axios from "axios";
import type { AxiosInstance } from "axios";
import type {
  AuthResponse,
  VendorLoginData,
  VendorRegisterData,
  Product,
  ProductFormData,
  VendorStats,
  Category,
  CatalogFilters,
  CatalogVendor,
} from "../types";
import {
  mockCategories,
  mockProducts,
  mockVendor,
  getMockStats,
  getAvailableProducts,
} from "../data/mockData";

/** Use mock data only when explicitly enabled (offline UI dev). */
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === "true";

/** In production, VITE_API_URL must be set at build time (Vercel env). Otherwise requests wrongly use localhost. */
function resolveApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (import.meta.env.DEV) return "http://localhost:5000/api";
  if (import.meta.env.PROD) {
    console.error(
      "[StockPulse] Missing VITE_API_URL. In Vercel → Settings → Environment Variables, set VITE_API_URL=https://YOUR-API.onrender.com/api and redeploy.",
    );
  }
  return "";
}

const API: AxiosInstance = axios.create({
  baseURL: resolveApiBase(),
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mock data storage (simulates database)
let mockProductsDB = [...mockProducts];

// Auth APIs
export const register = async (data: VendorRegisterData) => {
  if (USE_MOCK_DATA) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      data: {
        token: "mock-jwt-token-12345",
        vendor: {
          ...mockVendor,
          name: data.name,
          email: data.email,
          shop_name: data.shop_name,
        },
      } as AuthResponse,
    };
  }
  return API.post<AuthResponse>("/auth/register", data);
};

export const login = async (data: VendorLoginData) => {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Simple mock validation
    if (data.email && data.password.length >= 6) {
      return {
        data: {
          token: "mock-jwt-token-12345",
          vendor: mockVendor,
        } as AuthResponse,
      };
    }
    throw { response: { data: { message: "Invalid credentials" } } };
  }
  return API.post<AuthResponse>("/auth/login", data);
};

// Vendor APIs
export const getVendorProducts = async () => {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { data: mockProductsDB };
  }
  return API.get<Product[]>("/vendor/products");
};

export const addProduct = async (data: ProductFormData) => {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const category = mockCategories.find((c) => c._id === data.category_id);
    const newProduct: Product = {
      _id: `p${Date.now()}`,
      vendor_id: mockVendor,
      name: data.name,
      category_id: category || mockCategories[0],
      price: Number(data.price),
      quantity: Number(data.quantity),
      expiry_date: data.expiry_date || null,
      createdAt: new Date().toISOString(),
    };
    mockProductsDB = [newProduct, ...mockProductsDB];
    return { data: newProduct };
  }
  return API.post<Product>("/vendor/products", data);
};

export const updateProduct = async (id: string, data: ProductFormData) => {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const category = mockCategories.find((c) => c._id === data.category_id);
    mockProductsDB = mockProductsDB.map((p) =>
      p._id === id
        ? {
            ...p,
            name: data.name,
            category_id: category || p.category_id,
            price: Number(data.price),
            quantity: Number(data.quantity),
            expiry_date: data.expiry_date || null,
          }
        : p,
    );
    const updated = mockProductsDB.find((p) => p._id === id);
    return { data: updated as Product };
  }
  return API.put<Product>(`/vendor/products/${id}`, data);
};

export const deleteProduct = async (id: string) => {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    mockProductsDB = mockProductsDB.filter((p) => p._id !== id);
    return { data: { message: "Product deleted" } };
  }
  return API.delete(`/vendor/products/${id}`);
};

export const updateStock = async (id: string, quantity: number) => {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    mockProductsDB = mockProductsDB.map((p) =>
      p._id === id ? { ...p, quantity } : p,
    );
    const updated = mockProductsDB.find((p) => p._id === id);
    return { data: updated as Product };
  }
  return API.patch<Product>(`/vendor/products/${id}/stock`, { quantity });
};

export const getVendorStats = async () => {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return { data: getMockStats(mockProductsDB) };
  }
  return API.get<VendorStats>("/vendor/stats");
};

function mockShopName(p: Product): string {
  return typeof p.vendor_id === "object" ? p.vendor_id.shop_name : "";
}

function mockVendorId(p: Product): string {
  return typeof p.vendor_id === "object" ? p.vendor_id._id : "";
}

function applyCatalogSort(products: Product[], sort?: string): Product[] {
  const list = [...products];
  switch (sort) {
    case "store":
      return list.sort(
        (a, b) =>
          mockShopName(a).localeCompare(mockShopName(b)) ||
          a.name.localeCompare(b.name),
      );
    case "price_asc":
      return list.sort((a, b) => a.price - b.price);
    case "price_desc":
      return list.sort((a, b) => b.price - a.price);
    case "name":
      return list.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return list.sort(
        (a, b) =>
          new Date(b.createdAt ?? 0).getTime() -
          new Date(a.createdAt ?? 0).getTime(),
      );
  }
}

// Catalog APIs
export const getCatalogProducts = async (params?: CatalogFilters) => {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    let products = getAvailableProducts(mockProductsDB);

    if (params?.category) {
      products = products.filter((p) => p.category_id._id === params.category);
    }
    if (params?.vendor) {
      products = products.filter((p) => mockVendorId(p) === params.vendor);
    }
    if (params?.search) {
      const search = params.search.toLowerCase();
      products = products.filter((p) => p.name.toLowerCase().includes(search));
    }
    if (params?.minPrice) {
      products = products.filter((p) => p.price >= Number(params.minPrice));
    }
    if (params?.maxPrice) {
      products = products.filter((p) => p.price <= Number(params.maxPrice));
    }

    products = applyCatalogSort(products, params?.sort);
    return { data: products };
  }
  return API.get<Product[]>("/catalog/products", { params });
};

export const getCatalogVendors = async () => {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const map = new Map<string, string>();
    for (const p of getAvailableProducts(mockProductsDB)) {
      if (typeof p.vendor_id === "object") {
        map.set(p.vendor_id._id, p.vendor_id.shop_name);
      }
    }
    const data: CatalogVendor[] = [...map.entries()]
      .map(([_id, shop_name]) => ({ _id, shop_name }))
      .sort((a, b) => a.shop_name.localeCompare(b.shop_name));
    return { data };
  }
  return API.get<CatalogVendor[]>("/catalog/vendors");
};

export const getCategories = async () => {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return { data: mockCategories };
  }
  return API.get<Category[]>("/catalog/categories");
};

// Admin APIs
export const getWhitelist = () => API.get("/admin/whitelist");

export const addWhitelistName = (full_name: string) =>
  API.post("/admin/whitelist", { full_name });

export const deleteWhitelistName = (id: number) =>
  API.delete(`/admin/whitelist/${id}`);

export const getAllVendors = () => API.get("/admin/vendors");

export const setVendorActive = (id: string, is_active: boolean) =>
  API.patch(`/admin/vendors/${id}/active`, { is_active });

export default API;
