import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Zap, Code2, Shield } from "lucide-react";

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 cyber-card border-b border-cyber-electric-blue/30 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo with glitch effect */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="relative">
              <Code2 className="h-8 w-8 text-cyber-electric-blue neon-glow-blue" />
              <div className="absolute inset-0 animate-ping">
                <Code2 className="h-8 w-8 text-cyber-neon-pink opacity-30" />
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-orbitron font-bold tracking-wider text-cyber-white group-hover:text-cyber-electric-blue transition-colors duration-300">
                Elite<span className="text-cyber-neon-pink">Builders</span>
              </h1>
              <div className="h-0.5 bg-cyber-gradient-primary w-0 group-hover:w-full transition-all duration-500"></div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <NavLink href="/challenges" icon={<Zap className="w-4 h-4" />}>
              Challenges
            </NavLink>
            <NavLink href="/dashboard" icon={<User className="w-4 h-4" />}>
              Dashboard
            </NavLink>
            {user?.email?.includes('admin') && (
              <NavLink href="/admin" icon={<Shield className="w-4 h-4" />}>
                Admin
              </NavLink>
            )}
          </nav>

          {/* User actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-rajdhani font-medium text-cyber-electric-blue">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-cyber-lime-green rounded-full animate-pulse neon-glow-green"></div>
                    <span className="text-xs text-cyber-lime-green font-rajdhani">ONLINE</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="group"
                >
                  <LogOut className="w-4 h-4 group-hover:text-cyber-neon-pink transition-colors" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => navigate('/auth')}
                className="cyber-button"
              >
                <User className="w-4 h-4" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Scanning line effect */}
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyber-gradient-primary opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-20 h-0.5 bg-cyber-electric-blue animate-pulse neon-glow-blue"></div>
    </header>
  );
};

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const NavLink = ({ href, children, icon }: NavLinkProps) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(href)}
      className="group flex items-center space-x-2 text-cyber-white/80 hover:text-cyber-electric-blue font-rajdhani font-medium tracking-wide transition-all duration-300 relative"
    >
      {icon && (
        <span className="group-hover:text-cyber-electric-blue group-hover:drop-shadow-[0_0_8px_rgba(0,217,255,0.8)] transition-all duration-300">
          {icon}
        </span>
      )}
      <span className="group-hover:text-cyber-electric-blue transition-colors duration-300">
        {children}
      </span>
      <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyber-electric-blue group-hover:w-full transition-all duration-300 neon-glow-blue"></div>
    </button>
  );
};

export default Header;