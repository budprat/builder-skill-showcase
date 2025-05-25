
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
        // Use type assertion to bypass TypeScript error
        const { data, error } = await (supabase as any)
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();

        setIsAdmin(!!data);
      } catch (error) {
        console.log('User is not an admin');
        setIsAdmin(false);
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAdminAccess();
  }, [user]);

  if (loading || checkingAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              <Shield className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h1 className="text-xl font-bold mb-2">Access Denied</h1>
              <p className="text-muted-foreground">You need to be logged in to access this page.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              <Shield className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h1 className="text-xl font-bold mb-2">Admin Access Required</h1>
              <p className="text-muted-foreground">You don't have permission to access the admin panel.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <AdminPanel />;
};

export default Admin;
