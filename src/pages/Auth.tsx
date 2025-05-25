
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthForm } from "@/components/auth/AuthForm";
import { DebugAuth } from "@/components/auth/DebugAuth";

const Auth = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log("=== AUTH PAGE EFFECT ===");
    console.log("User exists:", !!user);
    console.log("Loading:", loading);
    
    // If user is already authenticated and not loading, redirect to dashboard
    if (!loading && user) {
      console.log("User already authenticated, redirecting to dashboard...");
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // If user is authenticated, show loading while redirecting
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white">Redirecting to dashboard...</div>
      </div>
    );
  }

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
