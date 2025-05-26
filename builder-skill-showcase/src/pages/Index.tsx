import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { ArrowRight, Star, Trophy, Zap, Users, Target, Award, Calendar, TrendingUp } from "lucide-react";

const Index = () => {
  const { hasUser } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="whitespace-layout">
        <div className="content">
          <div className="text-center content-spacing fade-in">
            {/* Elite Badge */}
            <div className="inline-flex items-center gap-2 mb-8">
              <Badge variant="accent" className="px-4 py-2">
                <Star className="w-4 h-4 mr-2" />
                <span>Elite AI Builder Community</span>
              </Badge>
            </div>

            <h1 className="gradient-flow font-bold mb-6 leading-tight">
              Build the Future of AI
            </h1>

            <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto fade-in-delay-1">
              Join our community of elite AI builders. Compete in cutting-edge challenges, 
              showcase your innovations, and shape the future of artificial intelligence.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center fade-in-delay-2">
              <Button 
                variant="default" 
                size="lg" 
                className="group"
                onClick={() => window.location.href = hasUser ? "/dashboard" : "/auth"}
              >
                {hasUser ? "Go to Dashboard" : "Start Building"}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg">
                View Challenges
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-spacing">
        <div className="container">
          <div className="text-center mb-16 fade-in">
            <h2 className="gradient-flow font-bold mb-4">
              Why Elite Builders Choose Us
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Experience the next generation of AI development competitions
            </p>
          </div>

          <div className="main-grid">
            <div className="col-span-8 md:col-span-4 fade-in-delay-1">
              <div className="minimal-card text-center">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-accent" />
                <h3 className="text-xl font-semibold mb-2">Competitive Excellence</h3>
                <p className="text-muted-foreground">
                  Compete against the world's top AI developers in challenging, real-world scenarios.
                </p>
              </div>
            </div>

            <div className="col-span-8 md:col-span-4 fade-in-delay-2">
              <div className="minimal-card text-center">
                <Zap className="w-12 h-12 mx-auto mb-4 text-accent" />
                <h3 className="text-xl font-semibold mb-2">Cutting-Edge Tech</h3>
                <p className="text-muted-foreground">
                  Work with the latest AI technologies, frameworks, and development tools.
                </p>
              </div>
            </div>

            <div className="col-span-8 md:col-span-4 fade-in-delay-3">
              <div className="minimal-card text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-accent" />
                <h3 className="text-xl font-semibold mb-2">Elite Community</h3>
                <p className="text-muted-foreground">
                  Connect with like-minded innovators and industry-leading AI experts.
                </p>
              </div>
            </div>

            <div className="col-span-8 md:col-span-4 fade-in-delay-1">
              <div className="minimal-card text-center">
                <Target className="w-12 h-12 mx-auto mb-4 text-accent" />
                <h3 className="text-xl font-semibold mb-2">Real Impact</h3>
                <p className="text-muted-foreground">
                  Build solutions that matter and make a difference in the world.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-spacing bg-muted/30">
        <div className="container">
          <div className="main-grid">
            <div className="col-span-8 text-center fade-in">
              <h2 className="gradient-flow font-bold mb-12">
                Join Thousands of Builders
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="fade-in-delay-1">
                  <div className="text-3xl font-bold gradient-flow mb-2">2,500+</div>
                  <div className="text-muted-foreground">Active Builders</div>
                </div>
                <div className="fade-in-delay-2">
                  <div className="text-3xl font-bold gradient-flow mb-2">150+</div>
                  <div className="text-muted-foreground">Challenges</div>
                </div>
                <div className="fade-in-delay-3">
                  <div className="text-3xl font-bold gradient-flow mb-2">$2M+</div>
                  <div className="text-muted-foreground">Prize Pool</div>
                </div>
                <div className="fade-in-delay-1">
                  <div className="text-3xl font-bold gradient-flow mb-2">50+</div>
                  <div className="text-muted-foreground">Countries</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-spacing">
        <div className="whitespace-layout">
          <div className="content text-center fade-in">
            <h2 className="gradient-flow font-bold mb-4">
              Ready to Build the Future?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join our community of elite AI builders and start creating solutions that matter.
            </p>
            <Button 
              variant="accent" 
              size="lg" 
              className="group"
              onClick={() => window.location.href = hasUser ? "/dashboard" : "/auth"}
            >
              {hasUser ? "Enter Dashboard" : "Join Now"}
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;