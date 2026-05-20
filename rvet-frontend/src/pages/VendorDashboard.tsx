import { useState, useEffect, useCallback } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getVendorProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getVendorStats,
  getCategories,
} from "../utils/api";
import type {
  Product,
  Category,
  VendorStats,
  ProductFormData,
  ExpiryStatus,
} from "../types";
import Footer from "../components/Footer";

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

const PackageIcon = () => (
  <svg
    className="w-6 h-6"
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

const ClockIcon = () => (
  <svg
    className="w-6 h-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const AlertIcon = () => (
  <svg
    className="w-6 h-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

const PlusIcon = () => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const EditIcon = () => (
  <svg
    className="w-4 h-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
);

const TrashIcon = () => (
  <svg
    className="w-4 h-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const LogoutIcon = () => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const XIcon = () => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const VendorDashboard = () => {
  const { vendor, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<VendorStats>({
    totalProducts: 0,
    expiringItems: 0,
    outOfStockItems: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    category_id: "",
    price: "",
    quantity: "",
    expiry_date: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const [productsRes, categoriesRes, statsRes] = await Promise.all([
        getVendorProducts(),
        getCategories(),
        getVendorStats(),
      ]);

      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setStats(statsRes.data);
      setLoading(false);
    } catch (error: unknown) {
      console.error("Error fetching data:", error);
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate("/login");
      }
    }
  }, [logout, navigate]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // sync with catalog real-time
    return () => clearInterval(interval);
  }, [fetchData]);

  const getExpiryStatus = (expiryDate: string | null): ExpiryStatus => {
    if (!expiryDate) return "none";
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "expired";
    if (diffDays <= 3) return "critical";
    if (diffDays <= 7) return "warning";
    return "safe";
  };

  const getExpiryBadge = (expiryDate: string | null) => {
    const status = getExpiryStatus(expiryDate);
    const badges: Record<ExpiryStatus, React.ReactNode> = {
      none: <span className="badge-neutral">No Expiry</span>,
      safe: <span className="badge-success">Fresh</span>,
      warning: <span className="badge-warning">Expiring</span>,
      critical: <span className="badge-danger">Critical</span>,
      expired: <span className="badge-danger">Expired</span>,
    };
    return badges[status];
  };

  const handleOpenModal = (product: Product | null = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category_id: product.category_id._id,
        price: product.price,
        quantity: product.quantity,
        expiry_date: product.expiry_date
          ? new Date(product.expiry_date).toISOString().split("T")[0]
          : "",
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        category_id: "",
        price: "",
        quantity: "",
        expiry_date: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateProduct(editingProduct._id, formData);
      } else {
        await addProduct(formData);
      }
      fetchData();
      handleCloseModal();
    } catch (error: unknown) {
      console.error("Error saving product:", error);
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || "Failed to save product");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(id);
        fetchData();
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Failed to delete product");
      }
    }
  };

  const handleQuickStockUpdate = async (id: string, newQuantity: string) => {
    try {
      await updateStock(id, parseInt(newQuantity));
      fetchData();
    } catch (error) {
      console.error("Error updating stock:", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <div className="card p-8 flex items-center gap-4">
          <svg
            className="animate-spin w-8 h-8 text-brand-500"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-lg font-medium text-surface-700">
            Loading dashboard...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/catalog" className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl text-white">
                <LensIcon />
              </div>
              <span className="text-xl font-display font-bold text-surface-800">
                Stock<span className="text-gradient">Lens</span>
              </span>
            </Link>

            {/* User Info & Actions */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-surface-900">
                  {vendor?.name}
                </p>
                <p className="text-xs text-surface-500">{vendor?.shop_name}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white font-bold">
                {vendor?.name?.charAt(0) || "V"}
              </div>
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl bg-surface-100 text-surface-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogoutIcon />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="card p-6 lg:p-8 mb-8 bg-gradient-to-r from-brand-500 to-brand-600 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
          <div className="relative z-10">
            <h1 className="text-2xl lg:text-3xl font-display font-bold mb-2">
              Welcome back, {vendor?.name?.split(" ")[0]}! 👋
            </h1>
            <p className="text-brand-100 text-lg">
              Here's what's happening with your inventory today.
            </p>
          </div>
        </div>

        {/* Stats Grid - Bento Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8">
          {/* Total Products */}
          <div className="card p-6 group hover:border-brand-300 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-2xl bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform">
                <PackageIcon />
              </div>
              <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider">
                Total
              </span>
            </div>
            <p className="text-4xl font-display font-bold text-surface-900 mb-1">
              {stats.totalProducts}
            </p>
            <p className="text-sm text-surface-500">Products in inventory</p>
          </div>

          {/* Expiring Soon */}
          <div className="card p-6 group hover:border-amber-300 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-2xl bg-amber-100 text-amber-600 group-hover:scale-110 transition-transform">
                <ClockIcon />
              </div>
              <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider">
                Attention
              </span>
            </div>
            <p
              className={`text-4xl font-display font-bold mb-1 ${stats.expiringItems > 0 ? "text-amber-600" : "text-surface-900"}`}
            >
              {stats.expiringItems}
            </p>
            <p className="text-sm text-surface-500">Expiring within 7 days</p>
          </div>

          {/* Out of Stock */}
          <div className="card p-6 group hover:border-red-300 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-2xl bg-red-100 text-red-600 group-hover:scale-110 transition-transform">
                <AlertIcon />
              </div>
              <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider">
                Critical
              </span>
            </div>
            <p
              className={`text-4xl font-display font-bold mb-1 ${stats.outOfStockItems > 0 ? "text-red-600" : "text-surface-900"}`}
            >
              {stats.outOfStockItems}
            </p>
            <p className="text-sm text-surface-500">Out of stock items</p>
          </div>
        </div>

        {/* Products Section */}
        <div className="card overflow-hidden">
          <div className="px-6 py-5 border-b border-surface-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-display font-bold text-surface-900">
                Your Products
              </h2>
              <p className="text-sm text-surface-500">
                {products.length} items in your inventory
              </p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="btn-primary flex items-center gap-2"
            >
              <PlusIcon />
              <span>Add Product</span>
            </button>
          </div>

          {products.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-surface-100 rounded-3xl flex items-center justify-center">
                <PackageIcon />
              </div>
              <h3 className="text-xl font-display font-bold text-surface-900 mb-2">
                No products yet
              </h3>
              <p className="text-surface-500 mb-6">
                Start building your inventory by adding your first product.
              </p>
              <button onClick={() => handleOpenModal()} className="btn-primary">
                Add your first product
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-surface-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {products.map((product) => (
                    <tr
                      key={product._id}
                      className="hover:bg-surface-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-surface-100 to-surface-200 flex items-center justify-center text-xl">
                            {product.category_id?.name === "Snacks" && "🍿"}
                            {product.category_id?.name === "Drinks" && "🥤"}
                            {product.category_id?.name === "Meals" && "🍱"}
                            {product.category_id?.name === "Stationery" && "📚"}
                            {product.category_id?.name === "Personal Care" &&
                              "🧴"}
                            {!product.category_id?.name && "📦"}
                          </div>
                          <span className="font-semibold text-surface-900">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-surface-600">
                          {product.category_id?.name || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-surface-900">
                          ₦{product.price.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          defaultValue={product.quantity}
                          onBlur={(e) => {
                            if (
                              e.target.value !== product.quantity.toString()
                            ) {
                              handleQuickStockUpdate(
                                product._id,
                                e.target.value,
                              );
                            }
                          }}
                          className="w-20 px-3 py-1.5 bg-surface-100 border-0 rounded-lg text-sm font-medium text-center focus:bg-white focus:ring-2 focus:ring-brand-400 transition-all"
                        />
                      </td>
                      <td className="px-6 py-4">
                        {getExpiryBadge(product.expiry_date)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(product)}
                            className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 hover:text-brand-600 transition-colors"
                            title="Edit"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="p-2 rounded-lg text-surface-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          <div className="relative card w-full max-w-md p-6 lg:p-8 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-bold text-surface-900">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-lg hover:bg-surface-100 text-surface-500 transition-colors"
              >
                <XIcon />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-surface-700 mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="input-modern"
                  placeholder="e.g., Chocolate Bar"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-surface-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setFormData({ ...formData, category_id: e.target.value })
                  }
                  required
                  className="input-modern"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-surface-700 mb-2">
                    Price (₦)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required
                    min="0"
                    step="0.01"
                    className="input-modern"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-surface-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    required
                    min="0"
                    className="input-modern"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-surface-700 mb-2">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, expiry_date: e.target.value })
                  }
                  className="input-modern"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 btn-primary">
                  {editingProduct ? "Update" : "Add"} Product
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;
