import { useState, useEffect, useCallback } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getWhitelist,
  addWhitelistName,
  deleteWhitelistName,
  getAllVendors,
  setVendorActive,
} from "../utils/api";
import type { WhitelistEntry, AdminVendor } from "../types";
import Footer from "../components/Footer";

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

const AdminDashboard = () => {
  const { vendor, logout } = useAuth();
  const navigate = useNavigate();

  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [wl, vs] = await Promise.all([getWhitelist(), getAllVendors()]);
      setWhitelist(wl.data);
      setVendors(vs.data);
      setLoading(false);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number } };
      if (e.response?.status === 401 || e.response?.status === 403) {
        logout();
        navigate("/login");
      }
      setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddName = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await addWhitelistName(newName.trim());
      setNewName("");
      await fetchData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Failed to add name");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteName = async (id: number, name: string) => {
    if (!confirm(`Remove "${name}" from the whitelist?`)) return;
    try {
      await deleteWhitelistName(id);
      await fetchData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || "Failed to remove name");
    }
  };

  const handleToggleActive = async (
    vendorId: string,
    currentActive: boolean,
    name: string,
  ) => {
    const action = currentActive ? "Deactivate" : "Activate";
    if (!confirm(`${action} ${name}'s account?`)) return;
    try {
      await setVendorActive(vendorId, !currentActive);
      await fetchData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || "Failed to update vendor");
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
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeDasharray="60"
              strokeDashoffset="20"
            />
          </svg>
          <span className="text-lg font-medium text-surface-700">
            Loading admin dashboard...
          </span>
        </div>
      </div>
    );
  }

  const totalWhitelist = whitelist.length;
  const availableWhitelist = whitelist.filter((w) => !w.is_used).length;
  const totalVendors = vendors.length;
  const activeVendors = vendors.filter((v) => v.is_active).length;
  const inactiveVendors = vendors.filter((v) => !v.is_active).length;

  return (
    <div className="min-h-screen mesh-bg">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 text-brand-600">
              <LensIcon />
              <span className="text-xl font-display font-bold">
                Stock<span className="text-gradient">Lens</span>
                <span className="text-surface-500 font-medium text-base ml-2">
                  Admin
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium text-surface-900">
                  {vendor?.name}
                </span>
                <span className="text-xs text-surface-500">Administrator</span>
              </div>
              <button onClick={handleLogout} className="btn-secondary">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-6 lg:p-8 mb-8 bg-gradient-to-r from-brand-500 to-brand-600 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl lg:text-3xl font-display font-bold mb-2">
              Welcome, {vendor?.name}
            </h1>
            <p className="text-brand-100">
              Manage whitelisted names and vendor accounts.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-5">
            <div className="text-xs uppercase text-surface-500 font-semibold tracking-wide">
              Whitelist
            </div>
            <div className="text-3xl font-display font-bold text-surface-900 mt-1">
              {totalWhitelist}
            </div>
            <div className="text-xs text-surface-500 mt-1">
              {availableWhitelist} available
            </div>
          </div>
          <div className="card p-5">
            <div className="text-xs uppercase text-surface-500 font-semibold tracking-wide">
              Total Vendors
            </div>
            <div className="text-3xl font-display font-bold text-surface-900 mt-1">
              {totalVendors}
            </div>
          </div>
          <div className="card p-5">
            <div className="text-xs uppercase text-surface-500 font-semibold tracking-wide">
              Active
            </div>
            <div className="text-3xl font-display font-bold text-green-600 mt-1">
              {activeVendors}
            </div>
          </div>
          <div className="card p-5">
            <div className="text-xs uppercase text-surface-500 font-semibold tracking-wide">
              Deactivated
            </div>
            <div className="text-3xl font-display font-bold text-red-600 mt-1">
              {inactiveVendors}
            </div>
          </div>
        </div>

        <section className="card mb-8 overflow-hidden">
          <div className="p-6 border-b border-surface-200">
            <h2 className="text-xl font-display font-bold text-surface-900 mb-1">
              Whitelist Management
            </h2>
            <p className="text-sm text-surface-500">
              Pre-approve vendor names who can register for an account.
            </p>
          </div>

          <div className="p-6 border-b border-surface-200">
            <form onSubmit={handleAddName} className="flex gap-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter a full name (e.g., Adaeze Okeke)"
                className="input-modern flex-1"
                disabled={submitting}
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting || !newName.trim()}
              >
                {submitting ? "Adding..." : "Add Name"}
              </button>
            </form>
            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            {whitelist.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-surface-500">
                  No whitelisted names yet. Add one above.
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-surface-50">
                  <tr>
                    <th className="text-left text-xs uppercase tracking-wide text-surface-500 font-semibold p-4">
                      Name
                    </th>
                    <th className="text-left text-xs uppercase tracking-wide text-surface-500 font-semibold p-4">
                      Status
                    </th>
                    <th className="text-left text-xs uppercase tracking-wide text-surface-500 font-semibold p-4">
                      Added
                    </th>
                    <th className="text-right text-xs uppercase tracking-wide text-surface-500 font-semibold p-4">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {whitelist.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-t border-surface-100 hover:bg-surface-50/50"
                    >
                      <td className="p-4 font-medium text-surface-900">
                        {entry.full_name}
                      </td>
                      <td className="p-4">
                        {entry.is_used ? (
                          <span className="badge-neutral">Used</span>
                        ) : (
                          <span className="badge-success">Available</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-surface-500">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        {!entry.is_used && (
                          <button
                            onClick={() =>
                              handleDeleteName(entry.id, entry.full_name)
                            }
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="card overflow-hidden">
          <div className="p-6 border-b border-surface-200">
            <h2 className="text-xl font-display font-bold text-surface-900 mb-1">
              Vendor Accounts
            </h2>
            <p className="text-sm text-surface-500">
              Manage vendor accounts. Deactivate to block login access.
            </p>
          </div>

          <div className="overflow-x-auto">
            {vendors.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-surface-500">No vendors registered.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-surface-50">
                  <tr>
                    <th className="text-left text-xs uppercase tracking-wide text-surface-500 font-semibold p-4">
                      Vendor
                    </th>
                    <th className="text-left text-xs uppercase tracking-wide text-surface-500 font-semibold p-4">
                      Shop
                    </th>
                    <th className="text-left text-xs uppercase tracking-wide text-surface-500 font-semibold p-4">
                      Email
                    </th>
                    <th className="text-left text-xs uppercase tracking-wide text-surface-500 font-semibold p-4">
                      Status
                    </th>
                    <th className="text-right text-xs uppercase tracking-wide text-surface-500 font-semibold p-4">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((v) => (
                    <tr
                      key={v.id}
                      className="border-t border-surface-100 hover:bg-surface-50/50"
                    >
                      <td className="p-4">
                        <div className="font-medium text-surface-900">
                          {v.name}
                        </div>
                        {v.is_admin && (
                          <span className="text-xs text-brand-600 font-semibold">
                            Administrator
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-surface-700">
                        {v.shop_name}
                      </td>
                      <td className="p-4 text-sm text-surface-500">
                        {v.email}
                      </td>
                      <td className="p-4">
                        {v.is_active ? (
                          <span className="badge-success">Active</span>
                        ) : (
                          <span className="badge-danger">Deactivated</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {v.id !== vendor?._id && (
                          <button
                            onClick={() =>
                              handleToggleActive(v.id, v.is_active, v.name)
                            }
                            className={
                              v.is_active
                                ? "text-red-600 hover:text-red-700 text-sm font-medium"
                                : "text-green-600 hover:text-green-700 text-sm font-medium"
                            }
                          >
                            {v.is_active ? "Deactivate" : "Activate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;