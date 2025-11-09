
import { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

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
    logger.auth("Auth provider initialized");

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logger.auth("Auth state changed", {
          event,
          hasSession: !!session,
          hasUser: !!session?.user,
        });

        // Update state
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Get initial session
    const getInitialSession = async () => {
      try {
        logger.auth("Getting initial session");
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logger.error("Error getting initial session", error);
        } else {
          logger.auth("Initial session retrieved", {
            hasSession: !!session,
            hasUser: !!session?.user,
          });
        }

        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        logger.error("Error in getInitialSession", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    return () => {
      logger.auth("Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      logger.auth("Sign out initiated");
      setLoading(true);

      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.error("Error signing out", error);
        throw error;
      }

      logger.auth("Sign out successful");
      // Hard redirect to clear all state
      window.location.href = "/";
    } catch (error) {
      logger.error("Sign out error", error);
      // Redirect anyway to clear state
      window.location.href = "/";
    } finally {
      setLoading(false);
    }
  };

  logger.debug("Auth provider render", {
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
