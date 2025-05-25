
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";

export const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
            E
          </div>
          <span className="text-2xl font-bold text-white">EliteBuilders</span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <button 
            onClick={() => navigate("/challenges")}
            className="text-white/80 hover:text-white transition-colors"
          >
            Challenges
          </button>
          <button 
            onClick={() => navigate("/dashboard")}
            className="text-white/80 hover:text-white transition-colors"
          >
            Dashboard
          </button>
          <a href="#leaderboard" className="text-white/80 hover:text-white transition-colors">
            Leaderboard
          </a>
        </nav>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/10"
                onClick={() => navigate("/dashboard")}
              >
                <User className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/10"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <>
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/10"
                onClick={() => navigate("/auth")}
              >
                Sign In
              </Button>
              <Button 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                onClick={() => navigate("/auth")}
              >
                Join as Builder
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
