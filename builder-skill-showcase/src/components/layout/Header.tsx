
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, Zap, Home, Trophy, BarChart3, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Challenges", href: "/challenges", icon: Trophy },
    { label: "Dashboard", href: "/dashboard", icon: BarChart3, authRequired: true },
  ];

  return (
    <header className="elite-nav sticky top-0 z-50 backdrop-blur-sm bg-[#003366]/95 border-b border-white/10">
      <div className="elite-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group transition-all duration-300"
            onClick={() => navigate("/")}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-[#FF6600] flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white font-['Montserrat']">
                EliteBuilders
              </h1>
              <Badge variant="accent" className="text-xs">
                AI PLATFORM
              </Badge>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              if (item.authRequired && !user) return null;
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.href)}
                  className="elite-nav-link flex items-center space-x-2 text-white/90 hover:text-[#FF6600] transition-colors font-semibold group"
                >
                  <item.icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Notification Bell */}
                <button className="relative p-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-[#FF6600] rounded-full"></span>
                </button>
                
                {/* User Profile */}
                <div className="flex items-center space-x-3 bg-white/10 rounded-lg px-4 py-2 border border-white/20">
                  <div className="w-8 h-8 rounded-lg bg-[#FF6600] flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white font-semibold font-['Open_Sans']">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </span>
                </div>
                
                <Button 
                  onClick={handleSignOut}
                  variant="secondary"
                  size="sm"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button 
                  onClick={() => navigate("/auth")}
                  variant="outline"
                  size="sm"
                  className="border-white/30 text-white hover:bg-white hover:text-[#003366]"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => navigate("/auth")}
                  variant="default"
                  size="sm"
                >
                  Join Now
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#003366]/98 backdrop-blur-lg border-b border-white/10 shadow-xl">
            <div className="p-4 space-y-4">
              {navItems.map((item) => {
                if (item.authRequired && !user) return null;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      navigate(item.href);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 w-full text-left p-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <item.icon className="h-5 w-5 text-[#FF6600]" />
                    <span className="font-semibold font-['Open_Sans']">{item.label}</span>
                  </button>
                );
              })}
              
              <div className="pt-4 border-t border-white/20">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/10">
                      <div className="w-8 h-8 rounded-lg bg-[#FF6600] flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-white font-semibold font-['Open_Sans']">
                        {user.user_metadata?.full_name || user.email?.split('@')[0]}
                      </span>
                    </div>
                    <Button 
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                      variant="secondary"
                      className="w-full"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button 
                      onClick={() => {
                        navigate("/auth");
                        setIsMenuOpen(false);
                      }}
                      variant="outline"
                      className="w-full border-white/30 text-white hover:bg-white hover:text-[#003366]"
                    >
                      Sign In
                    </Button>
                    <Button 
                      onClick={() => {
                        navigate("/auth");
                        setIsMenuOpen(false);
                      }}
                      variant="default"
                      className="w-full"
                    >
                      Join Now
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
