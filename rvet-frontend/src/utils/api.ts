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
} from "../types";
import {
  mockCategories,
  mockProducts,
  mockVendor,
  getMockStats,
  getAvailableProducts,
} from "../data/mockData";

// Set to true to use mock data (no backend needed)
const USE_MOCK_DATA = true;

const API: AxiosInstance = axios.create({
  baseURL: "http://localhost:5000/api",
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

// Catalog APIs
export const getCatalogProducts = async (params?: CatalogFilters) => {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    let products = getAvailableProducts(mockProductsDB);

    // Apply filters
    if (params?.category) {
      products = products.filter((p) => p.category_id._id === params.category);
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

    return { data: products };
  }
  return API.get<Product[]>("/catalog/products", { params });
};

export const getCategories = async () => {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return { data: mockCategories };
  }
  return API.get<Category[]>("/catalog/categories");
};

export default API;
