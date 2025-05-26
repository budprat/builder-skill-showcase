import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trophy, Users, Zap, Target, Star, Award, Code2 } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-deep-space via-primary/90 to-deep-space/80 relative overflow-hidden">
      {/* Subtle tech pattern overlay */}
      <div className="absolute inset-0 circuit-pattern opacity-5"></div>
      <div className="absolute inset-0 data-grid opacity-3"></div>

      <Header />

      {/* Hero Section - Foundry of Future AI Leaders */}
      <section className="relative section-spacing px-4">
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-5xl mx-auto content-spacing">
            {/* Elite Badge */}
            <div className="inline-flex items-center gap-2 elite-badge mb-6 animate-fade-in">
              <Star className="w-4 h-4" />
              <span>The Foundry of Future AI Leaders</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight animate-fade-in">
              Build the Future of{" "}
              <span className="bg-gradient-to-r from-cyber-teal to-nebula-purple bg-clip-text text-transparent">
                AI Products
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-white/80 mb-8 leading-relaxed max-w-4xl mx-auto animate-fade-in">
              Join elite AI builders in solving real-world challenges. Compete for substantial prizes, 
              build cutting-edge prototypes, and shape the next generation of AI applications in our 
              prestigious innovation accelerator.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-scale-in">
              <Button 
                size="lg" 
                className="cta-primary text-lg px-8 py-4 hover-lift"
                onClick={() => navigate(user ? "/challenges" : "/auth")}
              >
                {user ? "Explore Challenges" : "Join as Builder"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white/20 text-white hover:bg-white/10 text-lg px-8 py-4 hover-lift backdrop-blur-sm"
                onClick={() => navigate("/challenges")}
              >
                View Challenges
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Why Elite Builders */}
      <section className="section-spacing px-4 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Why Elite Builders?</h2>
            <p className="text-xl text-white/80">The premier platform for AI product development challenges</p>
          </div>

          <div className="elite-grid elite-grid-auto">
            <div className="text-center group hover-lift">
              <div className="w-16 h-16 bg-gradient-to-r from-cyber-teal to-nebula-purple rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse-glow transition-all duration-300">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Compete for Prizes</h3>
              <p className="text-white/70 leading-relaxed">Win substantial cash prizes and recognition from top companies in the AI industry</p>
            </div>

            <div className="text-center group hover-lift">
              <div className="w-16 h-16 bg-gradient-to-r from-nebula-purple to-solar-flare rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse-glow transition-all duration-300">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Build Real Solutions</h3>
              <p className="text-white/70 leading-relaxed">Work on actual problems facing companies and organizations worldwide</p>
            </div>

            <div className="text-center group hover-lift">
              <div className="w-16 h-16 bg-gradient-to-r from-solar-flare to-cyber-teal rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse-glow transition-all duration-300">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Elite Community</h3>
              <p className="text-white/70 leading-relaxed">Connect with top AI developers and researchers from around the globe</p>
            </div>

            <div className="text-center group hover-lift">
              <div className="w-16 h-16 bg-gradient-to-r from-cyber-teal to-nebula-purple rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse-glow transition-all duration-300">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Skill Development</h3>
              <p className="text-white/70 leading-relaxed">Advance your AI product development capabilities through real challenges</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Process Flow */}
      <section className="section-spacing px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-xl text-white/80">Simple steps to start building and competing</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center elite-card-hover p-8 bg-white/5 backdrop-blur-sm">
              <div className="w-16 h-16 bg-gradient-to-r from-cyber-teal to-nebula-purple rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-2xl">
                1
              </div>
              <div className="flex justify-center mb-4">
                <Code2 className="w-8 h-8 text-cyber-teal" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Choose a Challenge</h3>
              <p className="text-white/70 leading-relaxed">Browse available challenges from leading companies and select one that matches your expertise and interests</p>
            </div>

            <div className="text-center elite-card-hover p-8 bg-white/5 backdrop-blur-sm">
              <div className="w-16 h-16 bg-gradient-to-r from-cyber-teal to-nebula-purple rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-2xl">
                2
              </div>
              <div className="flex justify-center mb-4">
                <Zap className="w-8 h-8 text-cyber-teal" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Build Your Solution</h3>
              <p className="text-white/70 leading-relaxed">Develop a working prototype, create a compelling pitch deck, and record a demonstration video</p>
            </div>

            <div className="text-center elite-card-hover p-8 bg-white/5 backdrop-blur-sm">
              <div className="w-16 h-16 bg-gradient-to-r from-cyber-teal to-nebula-purple rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-2xl">
                3
              </div>
              <div className="flex justify-center mb-4">
                <Award className="w-8 h-8 text-cyber-teal" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Win & Get Recognized</h3>
              <p className="text-white/70 leading-relaxed">Submit your solution for expert judging and compete for prizes and career opportunities</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Call to Action */}
      <section className="section-spacing px-4 bg-gradient-to-r from-cyber-teal/10 via-nebula-purple/10 to-cyber-teal/10">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-6">Ready to Build the Future?</h2>
            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              Join thousands of elite AI builders competing in cutting-edge challenges. 
              Where innovation meets opportunity and potential becomes reality.
            </p>
            <Button 
              size="lg" 
              className="cta-primary text-lg px-8 py-6 hover-lift animate-pulse-glow"
              onClick={() => navigate(user ? "/challenges" : "/auth")}
            >
              {user ? "Start Building" : "Get Started Today"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Admin Tools (only visible to admin users) */}
      {showAdminTools && (
        <section className="py-10 px-4 border-t border-white/10 bg-black/20">
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