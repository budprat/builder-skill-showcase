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
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Quantum Particle Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="quantum-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Hero Section - Foundry of Future AI Leaders */}
      <section className="relative section-spacing px-4">
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-5xl mx-auto content-spacing">
            {/* Elite Badge */}
            <div className="inline-flex items-center gap-2 elite-badge mb-6 animate-fade-in">
              <Star className="w-4 h-4" />
              <span>The Foundry of Future AI Leaders</span>
            </div>

            
<div className="text-center space-y-8 animate-fade-in relative quantum-uncertain">
          <h1 className="text-5xl md:text-7xl font-black superposition chromatic-aberration" data-text="ELITE BUILDERS">
            ELITE BUILDERS
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
            Transcend quantum limitations. Compete in dimensional AI challenges. 
            <span className="gradient-holographic bg-clip-text text-transparent font-bold"> Build beyond reality.</span>
          </p>
</div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-scale-in">
              
<div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-4 transform-3d quantum-entangled"
              onClick={() => navigate("/challenges")}
            >
              <Trophy className="mr-2 h-5 w-5" />
              Enter Quantum Realm
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="text-lg px-8 py-4 transform-3d quantum-tunnel"
              onClick={() => navigate("/auth")}
            >
              Join the Collective
            </Button>
          </div>
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