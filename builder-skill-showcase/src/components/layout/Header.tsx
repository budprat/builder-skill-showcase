import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Home, Trophy, BarChart3, Settings, LogOut } from "lucide-react";

export function Header() {
  const location = useLocation();
  const { hasUser, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className="elite-header">
      <div className="elite-container">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-elite-blue rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-elite-blue mb-0">EliteBuilders</h1>
              <p className="text-xs text-gray-600 -mt-1">AI Innovation Platform</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-2">
            <Link
              to="/"
              className={cn(
                "elite-nav-link flex items-center gap-2",
                isActive("/") && "active"
              )}
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            <Link
              to="/challenges"
              className={cn(
                "elite-nav-link flex items-center gap-2",
                isActive("/challenges") && "active"
              )}
            >
              <Trophy className="w-4 h-4" />
              Challenges
            </Link>
            {hasUser && (
              <>
                <Link
                  to="/dashboard"
                  className={cn(
                    "elite-nav-link flex items-center gap-2",
                    isActive("/dashboard") && "active"
                  )}
                >
                  <BarChart3 className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  to="/admin"
                  className={cn(
                    "elite-nav-link flex items-center gap-2",
                    isActive("/admin") && "active"
                  )}
                >
                  <Settings className="w-4 h-4" />
                  Admin
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center space-x-3">
            {hasUser ? (
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/auth">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link to="/auth">
                  <Button>Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}