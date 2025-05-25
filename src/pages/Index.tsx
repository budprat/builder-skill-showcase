
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trophy, Users, Zap, Target } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { SampleDataCreator } from "@/components/admin/SampleDataCreator";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAdminTools, setShowAdminTools] = useState(false);

  // Show admin tools if user email contains 'admin' or is a specific test email
  useEffect(() => {
    if (user?.email && (user.email.includes('admin') || user.email === 'test@example.com')) {
      setShowAdminTools(true);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Build the Future of{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                AI Products
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-8 leading-relaxed">
              Join elite AI builders in solving real-world challenges. Compete for prizes, build cutting-edge prototypes, and shape the next generation of AI applications.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg px-8 py-4"
                onClick={() => navigate(user ? "/challenges" : "/auth")}
              >
                {user ? "Explore Challenges" : "Join as Builder"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white/20 text-white hover:bg-white/10 text-lg px-8 py-4"
                onClick={() => navigate("/challenges")}
              >
                View Challenges
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Why Elite Builders?</h2>
            <p className="text-xl text-white/80">The premier platform for AI product development challenges</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Compete for Prizes</h3>
              <p className="text-white/70">Win substantial cash prizes and recognition from top companies</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Build Real Solutions</h3>
              <p className="text-white/70">Work on actual problems facing companies and organizations</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Elite Community</h3>
              <p className="text-white/70">Connect with top AI developers and researchers worldwide</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Skill Development</h3>
              <p className="text-white/70">Advance your AI product development capabilities</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-white/5">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-xl text-white/80">Simple steps to start building and competing</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                1
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Choose a Challenge</h3>
              <p className="text-white/70">Browse available challenges from leading companies and select one that matches your expertise</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                2
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Build Your Solution</h3>
              <p className="text-white/70">Develop a working prototype, create a pitch deck, and record a demonstration video</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                3
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Win & Get Recognized</h3>
              <p className="text-white/70">Submit your solution for judging and compete for prizes and career opportunities</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Build the Future?</h2>
          <p className="text-xl text-white/80 mb-8">Join thousands of elite AI builders competing in cutting-edge challenges</p>
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg px-8 py-4"
            onClick={() => navigate(user ? "/challenges" : "/auth")}
          >
            {user ? "Start Building" : "Get Started Today"}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Admin Tools (only visible to admin users) */}
      {showAdminTools && (
        <section className="py-10 px-4 border-t border-white/10">
          <div className="container mx-auto">
            <div className="flex justify-center">
              <SampleDataCreator />
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Index;
