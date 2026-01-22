import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "admin" | "commercial" | "technician";
  allowedRoles?: Array<"admin" | "commercial" | "technician">;
}

export const ProtectedRoute = ({ 
  children, 
  requiredRole,
  allowedRoles 
}: ProtectedRouteProps) => {
  const { user, userRole, isLoading, isStaff } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user has required staff role
  if (!isStaff) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center glass-card p-8 max-w-md">
          <h2 className="font-display text-xl font-bold text-foreground mb-2">
            Accès non autorisé
          </h2>
          <p className="text-muted-foreground mb-4">
            Votre compte n'a pas encore de rôle attribué. Contactez un administrateur.
          </p>
          <p className="text-sm text-muted-foreground">
            Contact: +237 6 51 98 74 68
          </p>
        </div>
      </div>
    );
  }

  // Check specific role requirement
  if (requiredRole && userRole !== requiredRole && userRole !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Check if user role is in allowed roles
  if (allowedRoles && userRole && !allowedRoles.includes(userRole) && userRole !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
