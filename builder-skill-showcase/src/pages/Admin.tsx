
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";

const Admin = () => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        setCheckingAccess(false);
        return;
      }

      try {
        // Check if user has admin, sponsor, or evaluator role
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['admin', 'sponsor', 'evaluator']);

        setIsAdmin(data && data.length > 0);
      } catch (error) {
        console.log('User does not have admin access');
        setIsAdmin(false);
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAdminAccess();
  }, [user]);

  if (loading || checkingAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-800 font-medium">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <Card className="max-w-md mx-auto bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <Shield className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h1 className="text-xl font-bold mb-2 text-gray-900">Access Denied</h1>
              <p className="text-gray-600">You need to be logged in to access this page.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <Card className="max-w-md mx-auto bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <Shield className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h1 className="text-xl font-bold mb-2 text-gray-900">Access Required</h1>
              <p className="text-gray-600">You need admin, sponsor, or evaluator privileges to access this panel.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <AdminPanel />;
};

export default Admin;
