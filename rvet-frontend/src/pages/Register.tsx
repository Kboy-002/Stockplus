import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Icon Components
const LensIcon = () => (
  <svg
    className="w-8 h-8"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
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

const CheckIcon = () => (
  <svg
    className="w-4 h-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  shop_name: string;
}

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState<RegisterFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    shop_name: "",
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

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const { confirmPassword, ...registerData } = formData;
    void confirmPassword;
    const result = await register(registerData);

    if (result.success) {
      navigate("/vendor/dashboard");
    } else {
      setError(result.error || "Registration failed");
    }

    setLoading(false);
  };

  const passwordStrength = () => {
    const len = formData.password.length;
    if (len === 0) return null;
    if (len < 6) return { strength: 1, label: "Weak", color: "bg-red-400" };
    if (len < 10) return { strength: 2, label: "Fair", color: "bg-amber-400" };
    return { strength: 3, label: "Strong", color: "bg-green-400" };
  };

  const strength = passwordStrength();

  return (
    <div className="min-h-screen mesh-bg relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="float-element w-96 h-96 bg-accent-400 -top-48 -right-48 animate-pulse-slow" />
      <div className="float-element w-80 h-80 bg-brand-400 bottom-1/4 -left-40 animate-float" />
      <div className="float-element w-64 h-64 bg-accent-300 top-20 right-1/4 animate-pulse-slow" />

      <div className="min-h-screen flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-lg">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="p-2.5 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl text-white shadow-glow">
              <LensIcon />
            </div>
            <span className="text-2xl font-display font-bold text-surface-800">
              Stock<span className="text-gradient">Lens</span>
            </span>
          </div>

          {/* Form Card */}
          <div className="card p-8 lg:p-10 animate-slide-up">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-display font-bold text-surface-900 mb-2">
                Create your account ✨
              </h2>
              <p className="text-surface-500">
                Start managing your inventory like a pro
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Two column layout for name and shop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-surface-700 mb-2">
                    Your Name
                  </label>
                  <div
                    className={`transition-all duration-200 ${focusedField === "name" ? "scale-[1.02]" : ""}`}
                  >
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("name")}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="input-modern"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-surface-700 mb-2">
                    Shop Name
                  </label>
                  <div
                    className={`transition-all duration-200 ${focusedField === "shop_name" ? "scale-[1.02]" : ""}`}
                  >
                    <input
                      type="text"
                      name="shop_name"
                      value={formData.shop_name}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("shop_name")}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="input-modern"
                      placeholder="Fresh Corner"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-surface-700 mb-2">
                  Email Address
                </label>
                <div
                  className={`transition-all duration-200 ${focusedField === "email" ? "scale-[1.02]" : ""}`}
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
                <label className="block text-sm font-semibold text-surface-700 mb-2">
                  Password
                </label>
                <div
                  className={`transition-all duration-200 ${focusedField === "password" ? "scale-[1.02]" : ""}`}
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
                    placeholder="Minimum 6 characters"
                  />
                </div>
                {/* Password Strength Indicator */}
                {strength && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strength.color} transition-all duration-300`}
                        style={{ width: `${(strength.strength / 3) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-surface-500">
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-surface-700 mb-2">
                  Confirm Password
                </label>
                <div
                  className={`relative transition-all duration-200 ${focusedField === "confirmPassword" ? "scale-[1.02]" : ""}`}
                >
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("confirmPassword")}
                    onBlur={() => setFocusedField(null)}
                    required
                    className="input-modern"
                    placeholder="Re-enter your password"
                  />
                  {formData.confirmPassword &&
                    formData.password === formData.confirmPassword && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                        <CheckIcon />
                      </div>
                    )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2 mt-6"
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
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRightIcon />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-surface-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-brand-600 hover:text-brand-700 font-semibold transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Terms */}
          <p className="mt-6 text-center text-sm text-surface-400">
            By creating an account, you agree to our{" "}
            <a href="#" className="text-surface-600 hover:text-brand-600">
              Terms
            </a>{" "}
            and{" "}
            <a href="#" className="text-surface-600 hover:text-brand-600">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
