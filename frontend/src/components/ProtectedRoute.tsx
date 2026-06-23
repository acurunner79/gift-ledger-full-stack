import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

type ProtectedRouteProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading-screen">Loading Gift Ledger...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}