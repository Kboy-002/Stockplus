import { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { login as apiLogin, register as apiRegister } from '../utils/api';
import type { Vendor, VendorRegisterData } from '../types';

interface AuthContextType {
  vendor: Vendor | null;
  token: string | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (data: VendorRegisterData) => Promise<AuthResult>;
  logout: () => void;
  isAuthenticated: boolean;
}

interface AuthResult {
  success: boolean;
  error?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedVendor = localStorage.getItem('vendor');

    if (storedToken && storedVendor) {
      setToken(storedToken);
      setVendor(JSON.parse(storedVendor));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const response = await apiLogin({ email, password });
      const { token, vendor } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('vendor', JSON.stringify(vendor));

      setToken(token);
      setVendor(vendor);

      return { success: true };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || 'Login failed',
      };
    }
  };

  const register = async (data: VendorRegisterData): Promise<AuthResult> => {
    try {
      const response = await apiRegister(data);
      const { token, vendor } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('vendor', JSON.stringify(vendor));

      setToken(token);
      setVendor(vendor);

      return { success: true };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || 'Registration failed',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('vendor');
    setToken(null);
    setVendor(null);
  };

  const value: AuthContextType = {
    vendor,
    token,
    login,
    register,
    logout,
    isAuthenticated: !!token,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
