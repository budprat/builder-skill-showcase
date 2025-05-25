
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthForm } from "@/components/auth/AuthForm";
import { DebugAuth } from "@/components/auth/DebugAuth";

const Auth = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const navigate = useNavigate();

  useEffect(() => {
    console.log("=== AUTH PAGE INIT ===");
    
    // Check if user is already logged in
    const checkUser = async () => {
      console.log("Checking existing auth session...");
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log("Auth page session check:", { session, error });
        
        if (error) {
          console.error("Error checking session:", error);
          return;
        }
        
        if (session?.user) {
          console.log("User already authenticated, redirecting to dashboard...");
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error in checkUser:", error);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("=== AUTH PAGE - AUTH STATE CHANGE ===");
      console.log("Event:", event);
      console.log("Session:", session);
      console.log("User ID:", session?.user?.id);
      
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        console.log("User authenticated in auth page, navigating to dashboard...");
        navigate("/dashboard");
      }
    });

    return () => {
      console.log("Cleaning up auth page subscription");
      subscription.unsubscribe();
    };
  }, [navigate]);

  const toggleMode = () => {
    console.log("Toggling auth mode from", mode, "to", mode === "signin" ? "signup" : "signin");
    setMode(mode === "signin" ? "signup" : "signin");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
              E
            </div>
            <span className="text-2xl font-bold text-white">EliteBuilders</span>
          </div>
          <button
            onClick={() => navigate("/")}
            className="text-white/80 hover:text-white transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>

      {/* Auth Form */}
      <div className="w-full max-w-md">
        <AuthForm mode={mode} onToggleMode={toggleMode} />
        <DebugAuth />
      </div>
    </div>
  );
};

export default Auth;
