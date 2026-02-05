import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Icon Components
const LeafIcon = () => (
  <svg
    className="w-8 h-8"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

const SparkleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L13.09 8.26L19.27 9.27L13.09 10.27L12 16.54L10.91 10.27L4.73 9.27L10.91 8.26L12 2Z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate("/vendor/dashboard");
    } else {
      setError(result.error || "Login failed");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen mesh-bg relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="float-element w-96 h-96 bg-brand-400 -top-48 -left-48 animate-pulse-slow" />
      <div className="float-element w-80 h-80 bg-accent-400 top-1/4 -right-40 animate-float" />
      <div className="float-element w-64 h-64 bg-brand-300 bottom-20 left-1/4 animate-pulse-slow" />

      <div className="min-h-screen flex">
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 relative items-center justify-center p-12">
          <div className="relative z-10 max-w-md">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl text-white shadow-glow">
                <LeafIcon />
              </div>
              <span className="text-3xl font-display font-bold text-surface-800">
                Fresh<span className="text-gradient">Track</span>
              </span>
            </div>

            {/* Tagline */}
            <h1 className="text-4xl xl:text-5xl font-display font-bold text-surface-900 leading-tight mb-6">
              Keep your inventory <span className="text-gradient">fresh</span>{" "}
              and <span className="text-gradient">organized</span>
            </h1>

            <p className="text-lg text-surface-600 mb-8 leading-relaxed">
              The smart way to manage campus store inventory. Track expiry
              dates, monitor stock levels, and never miss a sale.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3">
              {["Real-time Updates", "Expiry Alerts", "Smart Analytics"].map(
                (feature, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full text-sm font-medium text-surface-700 border border-white/40"
                  >
                    <SparkleIcon />
                    {feature}
                  </span>
                ),
              )}
            </div>

            {/* Decorative Elements */}
            <div className="absolute -bottom-20 -left-20 w-40 h-40 border-2 border-brand-200 rounded-full" />
            <div className="absolute -top-10 right-10 w-20 h-20 border-2 border-accent-200 rounded-full" />
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="p-2.5 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl text-white">
                <LeafIcon />
              </div>
              <span className="text-2xl font-display font-bold text-surface-800">
                Fresh<span className="text-gradient">Track</span>
              </span>
            </div>

            {/* Form Card */}
            <div className="card p-8 lg:p-10 animate-slide-up">
              <div className="mb-8">
                <h2 className="text-2xl font-display font-bold text-surface-900 mb-2">
                  Welcome back! 👋
                </h2>
                <p className="text-surface-500">
                  Sign in to access your vendor dashboard
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-fade-in">
                  <div className="p-1.5 bg-red-100 rounded-lg">
                    <svg
                      className="w-4 h-4 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <span className="text-red-700 text-sm font-medium">
                    {error}
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-surface-700 mb-2">
                    Email Address
                  </label>
                  <div
                    className={`relative transition-all duration-200 ${focusedField === "email" ? "scale-[1.02]" : ""}`}
                  >
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="input-modern"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-surface-700">
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div
                    className={`relative transition-all duration-200 ${focusedField === "password" ? "scale-[1.02]" : ""}`}
                  >
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="input-modern"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center gap-2 mt-8"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
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
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRightIcon />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-surface-500">
                  New to FreshTrack?{" "}
                  <Link
                    to="/register"
                    className="text-brand-600 hover:text-brand-700 font-semibold transition-colors"
                  >
                    Create an account
                  </Link>
                </p>
              </div>
            </div>

            {/* Student Link */}
            <div className="mt-6 text-center">
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 px-6 py-3 text-surface-600 hover:text-brand-600 font-medium transition-colors group"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                <span>Browse products as student</span>
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
