import { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ReactNode } from 'react';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  userRole: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  userRole: null,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.log('No user role found or error:', error);
        setUserRole('participant'); // Default role
        return;
      }

      setUserRole(data.role);
      console.log('User role fetched:', data.role);
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('participant'); // Default role
    }
  };


  useEffect(() => {
    console.log("=== AUTH PROVIDER INIT ===");

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("=== AUTH STATE CHANGE ===");
        console.log("Event:", event);
        console.log("Session exists:", !!session);
        console.log("User exists:", !!session?.user);

        // Update state
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserRole(session.user.id);
        } else {
          setUserRole(null);
        }
        setLoading(false);
      }
    );

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log("=== GETTING INITIAL SESSION ===");
        const { data: { session }, error } = await supabase.auth.getSession();

        console.log("Initial session exists:", !!session);
        console.log("Initial user exists:", !!session?.user);

        if (error) {
          console.error("Error getting initial session:", error);
        }

        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserRole(session.user.id);
        } else {
          setUserRole(null);
        }
      } catch (error) {
        console.error("Error in getInitialSession:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    return () => {
      console.log("Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      console.log("=== SIGNING OUT ===");
      setLoading(true);

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
        throw error;
      }

      console.log("Sign out successful");
      window.location.href = "/";
    } catch (error) {
      console.error("Sign out error:", error);
      window.location.href = "/";
    } finally {
      setLoading(false);
    }
  };

  console.log("=== AUTH PROVIDER RENDER ===");
  console.log("Current state:", { 
    hasUser: !!user, 
    hasSession: !!session, 
    loading,
    userId: user?.id,
    userRole
  });

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, userRole }}>
      {children}
    </AuthContext.Provider>
  );
};