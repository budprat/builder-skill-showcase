
import { useAuth } from "@/hooks/useAuth";
import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
  fallbackMessage?: string;
}

export const RoleGuard = ({ 
  allowedRoles, 
  children, 
  fallbackMessage = "You don't have permission to access this content." 
}: RoleGuardProps) => {
  const { userRole, loading } = useAuth();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p>{fallbackMessage}</p>
            <p className="text-sm mt-2">Required roles: {allowedRoles.join(', ')}</p>
            <p className="text-sm">Your role: {userRole || 'None'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};
