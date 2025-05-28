import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, LogOut, Settings, Trophy, FileText, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const Header = () => {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Debug logging
  console.log('Header - User:', user?.id);
  console.log('Header - User Role:', userRole);

  

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/challenges", label: "Challenges" },
    { href: "/leaderboard", label: "Leaderboard" },
  ];

  if (user) {
    navItems.push({ href: "/dashboard", label: "Dashboard" });
    if (userRole === "admin") {
      navItems.push({ href: "/admin", label: "Admin" });
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        {/* Logo */}
        <div 
          className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate("/")}
        >
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
            N
          </div>
          <span className="text-xl font-bold text-gray-900 hidden sm:block">NUSpace</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => navigate("/challenges")}
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors relative group"
            >
              Challenges
              <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </button>
            <button
              onClick={() => navigate("/leaderboard")}
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors relative group"
            >
              Leaderboard
              <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </button>
            {user && (
              <button
                onClick={() => navigate("/dashboard")}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors relative group"
              >
                Dashboard
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
              </button>
            )}
            {userRole === 'admin' && (
              <button
                onClick={() => navigate("/admin")}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors relative group"
              >
                Admin
                <Badge className="ml-2 bg-red-100 text-red-800 border-red-200 text-xs">
                  Admin
                </Badge>
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
              </button>
            )}
          </nav>

        {/* Desktop User Menu */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {user.email?.split('@')[0]}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await signOut();
                  } catch (error) {
                    console.error("Logout error:", error);
                  }
                }}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => navigate("/auth")}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Sign In
              </Button>
              <Button
                onClick={() => navigate("/auth")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Get Started
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="border-gray-300 text-gray-700">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-white border-gray-200">
              <div className="flex flex-col h-full">
                <div className="flex items-center space-x-2 py-4 border-b border-gray-200">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                    N
                  </div>
                  <span className="text-xl font-bold text-gray-900">NUSpace</span>
                </div>

                <nav className="flex-1 py-6">
                  <div className="space-y-1">
                    {navItems.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => {
                          navigate(item.href);
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center justify-between w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          {item.label === "Home" && <Users className="h-4 w-4" />}
                          {item.label === "Challenges" && <Trophy className="h-4 w-4" />}
                          {item.label === "Leaderboard" && <Trophy className="h-4 w-4" />}
                          {item.label === "Dashboard" && <User className="h-4 w-4" />}
                          {item.label === "Admin" && <Settings className="h-4 w-4" />}
                          <span className="font-medium">{item.label}</span>
                        </div>
                        {item.label === "Admin" && (
                          <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                            Admin
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>
                </nav>

                {/* Mobile User Section */}
                <div className="border-t border-gray-200 pt-4 pb-6">
                  {user ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 px-3 py-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.email?.split('@')[0]}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            setIsMobileMenuOpen(false);
                            await signOut();
                          } catch (error) {
                            console.error("Logout error:", error);
                          }
                        }}
                        className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigate("/auth");
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Sign In
                      </Button>
                      <Button
                        onClick={() => {
                          navigate("/auth");
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Get Started
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};