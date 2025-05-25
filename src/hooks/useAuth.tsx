
import { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("=== AUTH PROVIDER INIT ===");
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("=== AUTH STATE CHANGE EVENT ===");
        console.log("Event:", event);
        console.log("Session exists:", !!session);
        console.log("User exists:", !!session?.user);
        console.log("User ID:", session?.user?.id);
        console.log("Access token exists:", !!session?.access_token);
        console.log("Current path:", window.location.pathname);
        
        // Update state immediately
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Handle different auth events - but only redirect if not already on target page
        if (event === 'SIGNED_IN' && session?.user) {
          console.log("=== USER SIGNED IN SUCCESSFULLY ===");
          
          // Only redirect if we're not on the auth page AND not already on dashboard
          if (window.location.pathname !== "/auth" && window.location.pathname !== "/dashboard") {
            console.log("Redirecting to dashboard...");
            setTimeout(() => {
              console.log("Executing redirect to dashboard");
              window.location.href = "/dashboard";
            }, 100);
          } else {
            console.log("Already on target page or auth page - skipping automatic redirect");
          }
        }
        
        if (event === 'SIGNED_OUT') {
          console.log("=== USER SIGNED OUT ===");
          setSession(null);
          setUser(null);
        }
        
        if (event === 'TOKEN_REFRESHED') {
          console.log("=== TOKEN REFRESHED ===");
        }
        
        if (event === 'USER_UPDATED') {
          console.log("=== USER UPDATED ===");
        }
      }
    );

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log("=== GETTING INITIAL SESSION ===");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log("Initial session check:");
        console.log("- Session exists:", !!session);
        console.log("- User exists:", !!session?.user);
        console.log("- User ID:", session?.user?.id);
        console.log("- Error:", error);
        
        if (error) {
          console.error("Error getting initial session:", error);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (error) {
        console.error("Error in getInitialSession:", error);
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
    userId: user?.id 
  });

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
