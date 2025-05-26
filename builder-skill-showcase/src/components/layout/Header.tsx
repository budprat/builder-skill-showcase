
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, Zap, Home, Trophy, BarChart3 } from "lucide-react";
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
    <header className="relative z-50 border-b border-white/10 backdrop-blur-xl bg-background/80">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-electric-purple to-neon-green flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-electric-purple to-neon-green opacity-50 blur-lg group-hover:opacity-70 transition-opacity"></div>
            </div>
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-electric-purple to-neon-green bg-clip-text text-transparent">
                EliteBuilders
              </h1>
              <Badge className="text-xs bg-neon-green/20 text-neon-green border-neon-green/30">
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
                  className="flex items-center space-x-2 text-white/80 hover:text-neon-green transition-colors font-semibold group"
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
                <div className="flex items-center space-x-3 bg-white/5 rounded-xl px-4 py-2 border border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-electric-purple to-neon-green flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white font-semibold">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </span>
                </div>
                <Button 
                  onClick={handleSignOut}
                  className="neo-secondary"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button 
                  onClick={() => navigate("/auth")}
                  className="neo-secondary"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => navigate("/auth")}
                  className="neo-primary"
                >
                  Join Now
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-white/10">
            <div className="px-4 py-6 space-y-4">
              {navItems.map((item) => {
                if (item.authRequired && !user) return null;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      navigate(item.href);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                  >
                    <item.icon className="h-5 w-5 text-neon-green" />
                    <span className="font-semibold">{item.label}</span>
                  </button>
                );
              })}
              
              <div className="pt-4 border-t border-white/10">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-electric-purple to-neon-green flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-white font-semibold">
                        {user.user_metadata?.full_name || user.email?.split('@')[0]}
                      </span>
                    </div>
                    <Button 
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                      className="w-full neo-secondary"
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
                      className="w-full neo-secondary"
                    >
                      Sign In
                    </Button>
                    <Button 
                      onClick={() => {
                        navigate("/auth");
                        setIsMenuOpen(false);
                      }}
                      className="w-full neo-primary"
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
