import type { Product, Category, VendorStats, Vendor } from "../types";

// Mock Categories
export const mockCategories: Category[] = [
  { _id: "1", name: "Snacks" },
  { _id: "2", name: "Drinks" },
  { _id: "3", name: "Meals" },
  { _id: "4", name: "Stationery" },
  { _id: "5", name: "Personal Care" },
];

// Mock Vendor
export const mockVendor: Vendor = {
  _id: "v1",
  name: "John Doe",
  email: "john@vendor.com",
  shop_name: "John's Corner Store",
};

// Helper to get date X days from now
const daysFromNow = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

// Mock Products
export const mockProducts: Product[] = [
  {
    _id: "p1",
    vendor_id: mockVendor,
    name: "Coca Cola 500ml",
    category_id: mockCategories[1], // Drinks
    price: 200,
    quantity: 50,
    expiry_date: daysFromNow(30),
    createdAt: new Date().toISOString(),
  },
  {
    _id: "p2",
    vendor_id: mockVendor,
    name: "Indomie Noodles",
    category_id: mockCategories[2], // Meals
    price: 150,
    quantity: 100,
    expiry_date: daysFromNow(60),
    createdAt: new Date().toISOString(),
  },
  {
    _id: "p3",
    vendor_id: mockVendor,
    name: "Gala Sausage Roll",
    category_id: mockCategories[0], // Snacks
    price: 300,
    quantity: 25,
    expiry_date: daysFromNow(5), // Warning - expires soon
    createdAt: new Date().toISOString(),
  },
  {
    _id: "p4",
    vendor_id: mockVendor,
    name: "Bic Pen (Blue)",
    category_id: mockCategories[3], // Stationery
    price: 100,
    quantity: 200,
    expiry_date: null, // No expiry
    createdAt: new Date().toISOString(),
  },
  {
    _id: "p5",
    vendor_id: mockVendor,
    name: "Close-Up Toothpaste",
    category_id: mockCategories[4], // Personal Care
    price: 500,
    quantity: 30,
    expiry_date: daysFromNow(90),
    createdAt: new Date().toISOString(),
  },
  {
    _id: "p6",
    vendor_id: mockVendor,
    name: "Pepsi 35cl",
    category_id: mockCategories[1], // Drinks
    price: 150,
    quantity: 8, // Low stock
    expiry_date: daysFromNow(2), // Critical - expires very soon
    createdAt: new Date().toISOString(),
  },
  {
    _id: "p7",
    vendor_id: mockVendor,
    name: "Digestive Biscuits",
    category_id: mockCategories[0], // Snacks
    price: 450,
    quantity: 0, // Out of stock
    expiry_date: daysFromNow(15),
    createdAt: new Date().toISOString(),
  },
  {
    _id: "p8",
    vendor_id: mockVendor,
    name: "Fanta Orange 50cl",
    category_id: mockCategories[1], // Drinks
    price: 200,
    quantity: 45,
    expiry_date: daysFromNow(25),
    createdAt: new Date().toISOString(),
  },
  {
    _id: "p9",
    vendor_id: mockVendor,
    name: "A4 Notebook (40 leaves)",
    category_id: mockCategories[3], // Stationery
    price: 350,
    quantity: 75,
    expiry_date: null,
    createdAt: new Date().toISOString(),
  },
  {
    _id: "p10",
    vendor_id: mockVendor,
    name: "Dettol Soap",
    category_id: mockCategories[4], // Personal Care
    price: 400,
    quantity: 20,
    expiry_date: daysFromNow(180),
    createdAt: new Date().toISOString(),
  },
  {
    _id: "p11",
    vendor_id: mockVendor,
    name: "Meatpie",
    category_id: mockCategories[2], // Meals
    price: 350,
    quantity: 12,
    expiry_date: daysFromNow(1), // Critical
    createdAt: new Date().toISOString(),
  },
  {
    _id: "p12",
    vendor_id: mockVendor,
    name: "Chin Chin (Small)",
    category_id: mockCategories[0], // Snacks
    price: 200,
    quantity: 40,
    expiry_date: daysFromNow(14),
    createdAt: new Date().toISOString(),
  },
];

// Calculate mock stats
export const getMockStats = (products: Product[]): VendorStats => {
  const today = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(today.getDate() + 7);

  return {
    totalProducts: products.length,
    outOfStockItems: products.filter((p) => p.quantity === 0).length,
    expiringItems: products.filter((p) => {
      if (!p.expiry_date) return false;
      const expiry = new Date(p.expiry_date);
      return expiry >= today && expiry <= sevenDaysFromNow;
    }).length,
  };
};

// Filter products for catalog (in-stock and not expired)
export const getAvailableProducts = (products: Product[]): Product[] => {
  const today = new Date();
  return products.filter((p) => {
    if (p.quantity <= 0) return false;
    if (p.expiry_date && new Date(p.expiry_date) < today) return false;
    return true;
  });
};
