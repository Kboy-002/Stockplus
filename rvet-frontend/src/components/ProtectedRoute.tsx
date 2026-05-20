import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const { isAuthenticated, vendor } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admin-only route: non-admins bounce to vendor dashboard
  if (adminOnly && !vendor?.is_admin) {
    return <Navigate to="/vendor/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;