import { useState, useEffect, useCallback } from "react";
import type { ChangeEvent } from "react";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { getCatalogProducts, getCategories, getCatalogVendors } from "../utils/api";
import type { Product, Category, CatalogFilters, CatalogVendor } from "../types";

// Icon Components
const LensIcon = () => (
  <svg
    className="w-6 h-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const SearchIcon = () => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const FilterIcon = () => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const ClockIcon = () => (
  <svg
    className="w-4 h-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const PackageIcon = () => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="m7.5 4.27 9 5.15" />
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
);

const StoreIcon = () => (
  <svg
    className="w-4 h-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
    <path d="M2 7h20" />
    <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
  </svg>
);

const StudentCatalog = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<CatalogVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CatalogFilters>({
    category: "",
    search: "",
    minPrice: "",
    maxPrice: "",
    vendor: "",
    sort: "newest",
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [, setTick] = useState(0); // forces re-render every second for relative time

  const fetchProducts = useCallback(async () => {
    try {
      const params: CatalogFilters = {};
      if (filters.category) params.category = filters.category;
      if (filters.vendor) params.vendor = filters.vendor;
      if (filters.search) params.search = filters.search;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.sort && filters.sort !== "newest") params.sort = filters.sort;

      const response = await getCatalogProducts(params);
      setProducts(response.data);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const response = await getCategories();
        setCategories(response.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await getCatalogVendors();
        setVendors(response.data);
      } catch (error) {
        console.error("Error fetching vendors:", error);
      }
    };
    fetchVendors();
  }, []);

  useEffect(() => {
    fetchProducts();
    const interval = setInterval(() => {
      fetchProducts();
      getCatalogVendors()
        .then((r) => setVendors(r.data))
        .catch(() => {});
    }, 5000); // 5 seconds — real-time visibility
    return () => clearInterval(interval);
  }, [fetchProducts]);

  // Ticks every second so the "Updated Xs ago" indicator stays current
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetailProduct(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleFilterChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      search: "",
      minPrice: "",
      maxPrice: "",
      vendor: "",
      sort: "newest",
    });
  };

  const getExpiryDays = (expiryDate: string | null): number | null => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpiryBadge = (expiryDate: string | null) => {
    const days = getExpiryDays(expiryDate);
    if (days === null) return null;

    if (days < 0) {
      return (
        <span className="badge-danger">
          <ClockIcon />
          <span className="ml-1">Expired</span>
        </span>
      );
    }
    if (days <= 3) {
      return (
        <span className="badge-danger">
          <ClockIcon />
          <span className="ml-1">{days}d left</span>
        </span>
      );
    }
    if (days <= 7) {
      return (
        <span className="badge-warning">
          <ClockIcon />
          <span className="ml-1">{days}d left</span>
        </span>
      );
    }
    return (
      <span className="badge-success">
        <ClockIcon />
        <span className="ml-1">Fresh</span>
      </span>
    );
  };

  const hasActiveFilters =
    filters.category ||
    filters.vendor ||
    filters.search ||
    filters.minPrice ||
    filters.maxPrice ||
    (filters.sort && filters.sort !== "newest");

  const relativeTime = (date: Date | null): string => {
    if (!date) return "loading...";
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 2) return "just now";
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return date.toLocaleTimeString();
  };
  const formatExpiryDetail = (expiryDate: string | null): string => {
    if (!expiryDate) return "No expiry date";
    const days = getExpiryDays(expiryDate);
    if (days === null) return "No expiry date";
    const d = new Date(expiryDate);
    return `${d.toLocaleDateString()} (${days} day${days === 1 ? "" : "s"} left)`;
  };

  return (
    <div className="min-h-screen mesh-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl text-white">
                <LensIcon />
              </div>
              <span className="text-xl font-display font-bold text-surface-800">
                Stock<span className="text-gradient">Lens</span>
              </span>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-surface-400">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Search products..."
                  className="w-full pl-12 pr-4 py-3 bg-surface-100 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-brand-400 transition-all duration-200 text-surface-800 placeholder-surface-400"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 rounded-xl transition-all duration-200 ${
                  showFilters || hasActiveFilters
                    ? "bg-brand-500 text-white"
                    : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                }`}
              >
                <FilterIcon />
              </button>
              <Link
                to="/login"
                className="btn-primary hidden sm:flex items-center gap-2"
              >
                <StoreIcon />
                <span>Vendor Portal</span>
              </Link>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden pb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-surface-400">
                <SearchIcon />
              </div>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search products..."
                className="w-full pl-12 pr-4 py-3 bg-surface-100 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-brand-400 transition-all duration-200"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border-b border-surface-200 animate-slide-up">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-semibold text-surface-700 mb-2">
                  Store
                </label>
                <select
                  name="vendor"
                  value={filters.vendor ?? ""}
                  onChange={handleFilterChange}
                  className="input-modern"
                >
                  <option value="">All stores</option>
                  {vendors.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.shop_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-semibold text-surface-700 mb-2">
                  Sort by
                </label>
                <select
                  name="sort"
                  value={filters.sort ?? "newest"}
                  onChange={handleFilterChange}
                  className="input-modern"
                >
                  <option value="newest">Newest first</option>
                  <option value="store">Store name (A–Z)</option>
                  <option value="price_asc">Price: low to high</option>
                  <option value="price_desc">Price: high to low</option>
                  <option value="name">Product name (A–Z)</option>
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-semibold text-surface-700 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="input-modern"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-32">
                <label className="block text-sm font-semibold text-surface-700 mb-2">
                  Min Price
                </label>
                <input
                  type="number"
                  name="minPrice"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  placeholder="₦0"
                  min="0"
                  className="input-modern"
                />
              </div>
              <div className="w-32">
                <label className="block text-sm font-semibold text-surface-700 mb-2">
                  Max Price
                </label>
                <input
                  type="number"
                  name="maxPrice"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  placeholder="₦∞"
                  min="0"
                  className="input-modern"
                />
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="btn-ghost text-red-600 hover:bg-red-50"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4 mb-6">
          <button
            onClick={() => setFilters({ ...filters, category: "" })}
            className={`px-5 py-2.5 rounded-full font-medium whitespace-nowrap transition-all duration-200 ${
              !filters.category
                ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25"
                : "bg-white text-surface-600 hover:bg-surface-100 border border-surface-200"
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setFilters({ ...filters, category: cat._id })}
              className={`px-5 py-2.5 rounded-full font-medium whitespace-nowrap transition-all duration-200 ${
                filters.category === cat._id
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25"
                  : "bg-white text-surface-600 hover:bg-surface-100 border border-surface-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Store filter + sort (always visible) */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-surface-700 mb-2">
              Store
            </label>
            <select
              name="vendor"
              value={filters.vendor ?? ""}
              onChange={handleFilterChange}
              className="input-modern w-full"
            >
              <option value="">All stores</option>
              {vendors.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.shop_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-surface-700 mb-2">
              Sort by
            </label>
            <select
              name="sort"
              value={filters.sort ?? "newest"}
              onChange={handleFilterChange}
              className="input-modern w-full"
            >
              <option value="newest">Newest first</option>
              <option value="store">Store name (A–Z)</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="name">Product name (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-surface-600">
            <span className="font-semibold text-surface-900">
              {products.length}
            </span>{" "}
            products available
            {hasActiveFilters && " (filtered)"}
          </p>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="w-full h-40 bg-surface-200 rounded-2xl mb-4" />
                <div className="h-4 bg-surface-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-surface-200 rounded w-1/2 mb-4" />
                <div className="h-8 bg-surface-200 rounded" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-surface-100 rounded-3xl flex items-center justify-center">
              <PackageIcon />
            </div>
            <h3 className="text-xl font-display font-bold text-surface-900 mb-2">
              No products found
            </h3>
            <p className="text-surface-500 mb-6">
              Try adjusting your filters or check back later.
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn-secondary">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                className="card-interactive group overflow-hidden"
              >
                {/* Product Image Placeholder */}
                <div className="relative h-44 bg-gradient-to-br from-surface-100 to-surface-200 flex items-center justify-center overflow-hidden">
                  <div className="text-6xl opacity-50 group-hover:scale-110 transition-transform duration-300">
                    {product.category_id?.name === "Snacks" && "🍿"}
                    {product.category_id?.name === "Drinks" && "🥤"}
                    {product.category_id?.name === "Meals" && "🍱"}
                    {product.category_id?.name === "Stationery" && "📚"}
                    {product.category_id?.name === "Personal Care" && "🧴"}
                    {!product.category_id?.name && "📦"}
                  </div>
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {product.quantity < 10 && (
                      <span className="badge-danger">Low Stock</span>
                    )}
                    {getExpiryBadge(product.expiry_date)}
                  </div>
                </div>

                <div className="p-5">
                  {/* Category */}
                  <span className="text-xs font-semibold text-brand-600 uppercase tracking-wide">
                    {product.category_id?.name || "Uncategorized"}
                  </span>

                  {/* Product Name */}
                  <h3 className="text-lg font-display font-bold text-surface-900 mt-1 mb-3 line-clamp-1">
                    {product.name}
                  </h3>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-surface-500">Price</span>
                      <span className="text-xl font-bold text-gradient">
                        ₦{product.price.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-surface-500">In Stock</span>
                      <span
                        className={`text-sm font-semibold ${product.quantity < 10 ? "text-red-600" : "text-surface-900"}`}
                      >
                        {product.quantity} units
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-surface-500">
                      <StoreIcon />
                      <span className="truncate">
                        {typeof product.vendor_id === "object"
                          ? product.vendor_id.shop_name
                          : "Unknown"}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={() => setDetailProduct(product)}
                    className="w-full btn-secondary text-sm py-2.5"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Product detail modal */}
      {detailProduct && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-detail-title"
          onClick={() => setDetailProduct(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-surface-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-surface-100 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide">
                  {detailProduct.category_id?.name || "Uncategorized"}
                </p>
                <h2
                  id="product-detail-title"
                  className="text-xl font-display font-bold text-surface-900 mt-1"
                >
                  {detailProduct.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                className="shrink-0 p-2 rounded-xl text-surface-500 hover:bg-surface-100 hover:text-surface-800 transition-colors"
                aria-label="Close"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4 text-left">
              <div className="flex justify-between items-baseline gap-4">
                <span className="text-surface-500 text-sm">Price</span>
                <span className="text-2xl font-bold text-gradient">
                  ₦{detailProduct.price.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-surface-500 text-sm">In stock</span>
                <span
                  className={`font-semibold ${detailProduct.quantity < 10 ? "text-red-600" : "text-surface-900"}`}
                >
                  {detailProduct.quantity} units
                </span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-surface-500 text-sm shrink-0">Expiry</span>
                <span className="text-surface-800 text-sm text-right">
                  {formatExpiryDetail(detailProduct.expiry_date)}
                </span>
              </div>
              <div className="pt-4 border-t border-surface-100">
                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">
                  Store
                </p>
                <div className="flex items-start gap-2 text-surface-800">
                  <StoreIcon />
                  <div>
                    <p className="font-semibold">
                      {typeof detailProduct.vendor_id === "object"
                        ? detailProduct.vendor_id.shop_name
                        : "Unknown"}
                    </p>
                    {typeof detailProduct.vendor_id === "object" && (
                      <p className="text-sm text-surface-500 mt-0.5">
                        {detailProduct.vendor_id.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 pt-0">
              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                className="w-full btn-primary py-3"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
{/* Footer */}
      <Footer />

      {/* Live Indicator */}
      <div className="fixed bottom-6 right-6 glass-card px-4 py-3 rounded-2xl flex items-center gap-3 animate-fade-in"></div>
      {/* Live Indicator */}
      <div className="fixed bottom-6 right-6 glass-card px-4 py-3 rounded-2xl flex items-center gap-3 animate-fade-in">
        <div className="relative flex items-center justify-center">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <div className="absolute w-3 h-3 bg-green-500 rounded-full animate-ping" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-surface-700">Live</span>
          <span className="text-xs text-surface-500">
            Updated {relativeTime(lastUpdated)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StudentCatalog;
