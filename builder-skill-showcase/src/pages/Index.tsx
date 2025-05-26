
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { EcosystemEffects, WeatherSystem, BioCircuitOverlay } from "@/components/ui/ecosystem-effects";
import { ArrowRight, Star, Trophy, Zap, Users, Target, Award, Calendar, TrendingUp } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAdminTools, setShowAdminTools] = useState(false);

  useEffect(() => {
    if (user?.email && (user.email.includes('admin') || user.email === 'test@example.com')) {
      setShowAdminTools(true);
    }
  }, [user]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Weather and Environmental Effects */}
      <WeatherSystem />
      <EcosystemEffects particleCount={25} type="pollen" />
      <EcosystemEffects particleCount={15} type="photosynthesis" />
      
      <Header />
      
      {/* Hero Section */}
      <section className="relative section-spacing px-4 z-20">
        <div className="container mx-auto text-center relative">
          <div className="max-w-5xl mx-auto content-spacing">
            {/* Elite Badge */}
            <div className="inline-flex items-center gap-2 mb-6 animate-fade-in">
              <Badge variant="flora" className="px-4 py-2">
                <Star className="w-4 h-4 mr-2" />
                <span>The Digital Ecosystem of AI Innovation</span>
              </Badge>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight animate-fade-in font-orbitron">
              Cultivate the Future of{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AI Nature
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed max-w-4xl mx-auto animate-fade-in">
              Where artificial intelligence meets organic innovation. Join our digital ecosystem of elite AI builders, 
              growing cutting-edge solutions through biomimetic development processes and sustainable technological evolution.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-scale-in">
              <Button 
                size="lg" 
                variant="default"
                className="text-lg px-8 py-4 hover-lift"
                onClick={() => navigate(user ? "/challenges" : "/auth")}
              >
                {user ? "Explore Digital Garden" : "Join the Ecosystem"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-4 hover-lift"
                onClick={() => navigate("/challenges")}
              >
                View Bio-Challenges
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-spacing px-4 relative z-20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4 font-orbitron">Why Our Digital Ecosystem?</h2>
            <p className="text-xl text-muted-foreground">Where nature-inspired algorithms meet cutting-edge AI development</p>
          </div>
          
          <div className="organic-grid">
            <div className="text-center group hover-lift relative">
              <BioCircuitOverlay className="opacity-10" />
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-bloom transition-all duration-300 relative z-10">
                <Trophy className="h-8 w-8 text-background" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3 relative z-10">Organic Growth Rewards</h3>
              <p className="text-muted-foreground leading-relaxed relative z-10">Cultivate substantial rewards through nature-inspired AI innovation cycles</p>
            </div>
            
            <div className="text-center group hover-lift relative">
              <BioCircuitOverlay className="opacity-10" />
              <div className="w-16 h-16 bg-gradient-to-r from-accent to-organic-tech rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-bloom transition-all duration-300 relative z-10">
                <Zap className="h-8 w-8 text-background" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3 relative z-10">Bio-Electric Solutions</h3>
              <p className="text-muted-foreground leading-relaxed relative z-10">Develop AI solutions that mirror natural processes and evolutionary principles</p>
            </div>
            
            <div className="text-center group hover-lift relative">
              <BioCircuitOverlay className="opacity-10" />
              <div className="w-16 h-16 bg-gradient-to-r from-organic-tech to-energy-flow rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-bloom transition-all duration-300 relative z-10">
                <Users className="h-8 w-8 text-background" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3 relative z-10">Symbiotic Community</h3>
              <p className="text-muted-foreground leading-relaxed relative z-10">Connect with AI architects in our thriving digital ecosystem network</p>
            </div>
            
            <div className="text-center group hover-lift relative">
              <BioCircuitOverlay className="opacity-10" />
              <div className="w-16 h-16 bg-gradient-to-r from-energy-flow to-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-bloom transition-all duration-300 relative z-10">
                <Target className="h-8 w-8 text-background" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3 relative z-10">Evolutionary Learning</h3>
              <p className="text-muted-foreground leading-relaxed relative z-10">Advance through adaptive AI development in our living learning environment</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section-spacing px-4 relative z-20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4 font-orbitron">Digital Evolution Process</h2>
            <p className="text-xl text-muted-foreground">Three phases of AI ecosystem development</p>
          </div>
          
          <div className="organic-grid max-w-4xl mx-auto">
            <div className="text-center ecosystem-card p-8 group">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-6 text-background font-bold text-2xl group-hover:animate-bloom">
                1
              </div>
              <div className="flex justify-center mb-4">
                <Calendar className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Seedling Selection</h3>
              <p className="text-muted-foreground leading-relaxed">Choose from bio-inspired AI challenges that mirror natural adaptation processes</p>
            </div>
            
            <div className="text-center ecosystem-card p-8 group">
              <div className="w-16 h-16 bg-gradient-to-r from-accent to-organic-tech rounded-full flex items-center justify-center mx-auto mb-6 text-background font-bold text-2xl group-hover:animate-bloom">
                2
              </div>
              <div className="flex justify-center mb-4">
                <Zap className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Growth & Development</h3>
              <p className="text-muted-foreground leading-relaxed">Cultivate your AI prototype through iterative cycles, mimicking natural evolution</p>
            </div>
            
            <div className="text-center ecosystem-card p-8 group">
              <div className="w-16 h-16 bg-gradient-to-r from-organic-tech to-energy-flow rounded-full flex items-center justify-center mx-auto mb-6 text-background font-bold text-2xl group-hover:animate-bloom">
                3
              </div>
              <div className="flex justify-center mb-4">
                <Award className="w-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Harvest & Recognition</h3>
              <p className="text-muted-foreground leading-relaxed">Submit your evolved solution for ecosystem validation and recognition rewards</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-spacing px-4 relative z-20">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto ecosystem-card p-12">
            <BioCircuitOverlay className="opacity-5" />
            <h2 className="text-3xl font-bold text-foreground mb-6 relative z-10 font-orbitron">
              Ready to Join Our Digital Ecosystem?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 relative z-10">
              Start cultivating AI solutions that grow, adapt, and evolve in our bio-inspired development environment.
            </p>
            <Button 
              size="lg" 
              variant="default"
              className="text-lg px-8 py-4 hover-lift relative z-10"
              onClick={() => navigate(user ? "/challenges" : "/auth")}
            >
              Begin Your Evolution
              <TrendingUp className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
