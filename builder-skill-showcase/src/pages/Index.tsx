
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Star, Trophy, Users, Zap, Code, Brain, Rocket, Shield, Target, Award, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";

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

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Challenges",
      description: "Cutting-edge AI problems that push the boundaries of what's possible",
      color: "text-electric-purple"
    },
    {
      icon: Trophy,
      title: "Premium Rewards",
      description: "Substantial prizes and recognition for outstanding innovations",
      color: "text-electric-orange"
    },
    {
      icon: Code,
      title: "Real-World Impact",
      description: "Build solutions that matter and shape the future of technology",
      color: "text-neon-green"
    },
    {
      icon: Users,
      title: "Elite Community",
      description: "Connect with top-tier AI builders and industry leaders",
      color: "text-electric-blue"
    }
  ];

  const stats = [
    { number: "10K+", label: "Elite Builders", icon: Users },
    { number: "$500K+", label: "Total Prizes", icon: Trophy },
    { number: "95%", label: "Success Rate", icon: Target },
    { number: "24/7", label: "AI Support", icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 neo-grid opacity-20"></div>
      <div className="absolute inset-0 glow-dots opacity-10"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-electric-purple rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-green rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-hot-pink rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-pulse"></div>
      
      <Header />
      
      {/* Hero Section */}
      <section className="relative section-spacing px-4">
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-6xl mx-auto content-spacing">
            {/* Elite Badge */}
            <div className="inline-flex items-center gap-3 neo-badge mb-8 floating">
              <Star className="w-5 h-5" />
              <span>The Future of AI Innovation</span>
              <Zap className="w-5 h-5" />
            </div>

            <h1 className="text-6xl md:text-8xl font-black text-white mb-8 leading-tight">
              Build Tomorrow's{" "}
              <span className="block bg-gradient-to-r from-electric-purple via-neon-green to-electric-blue bg-clip-text text-transparent gradient-shift">
                AI Revolution
              </span>
            </h1>
            
            <p className="text-2xl md:text-3xl text-white/90 mb-12 leading-relaxed max-w-5xl mx-auto font-medium">
              Join the most exclusive AI builders community. Compete in cutting-edge challenges, 
              earn substantial rewards, and build the future of artificial intelligence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Button 
                size="lg" 
                className="neo-primary text-xl px-10 py-6 hover-lift group"
                onClick={() => navigate(user ? "/challenges" : "/auth")}
              >
                {user ? "Explore Challenges" : "Join Elite Builders"}
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                className="neo-secondary text-xl px-10 py-6 hover-lift group"
                onClick={() => navigate("/challenges")}
              >
                View Live Challenges
                <ChevronRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
              {stats.map((stat, index) => (
                <Card key={index} className="neo-card-hover text-center">
                  <CardContent className="p-6">
                    <stat.icon className="h-8 w-8 mx-auto mb-3 text-neon-green" />
                    <div className="text-3xl font-black text-white mb-2">{stat.number}</div>
                    <div className="text-white/70 font-semibold">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="neo-badge-secondary mb-6">
              <Rocket className="w-4 h-4 mr-2" />
              Revolutionary Platform
            </Badge>
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
              Why Elite Builders Choose Us
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Experience the most advanced AI challenge platform designed for tomorrow's innovators
            </p>
          </div>

          <div className="neo-grid neo-grid-auto">
            {features.map((feature, index) => (
              <Card key={index} className="neo-card-hover group">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-4 rounded-2xl bg-gradient-to-br from-electric-purple/20 to-neon-green/20 w-fit">
                    <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-2xl text-white group-hover:text-neon-green transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-white/70 text-lg leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center">
          <Card className="neo-card max-w-4xl mx-auto glow-purple">
            <CardContent className="p-12">
              <div className="flex justify-center mb-6">
                <Badge className="neo-badge-accent">
                  <Award className="w-4 h-4 mr-2" />
                  Limited Access
                </Badge>
              </div>
              <h3 className="text-4xl md:text-5xl font-black text-white mb-6">
                Ready to Build the Future?
              </h3>
              <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                Join thousands of elite AI builders who are already shaping tomorrow's technology. 
                Your next breakthrough starts here.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="neo-primary text-lg px-8 py-4 hover-lift"
                  onClick={() => navigate(user ? "/dashboard" : "/auth")}
                >
                  {user ? "Go to Dashboard" : "Start Building Now"}
                  <Rocket className="ml-2 h-5 w-5" />
                </Button>
                {showAdminTools && (
                  <Button 
                    size="lg" 
                    className="neo-secondary text-lg px-8 py-4 hover-lift"
                    onClick={() => navigate("/admin")}
                  >
                    Admin Panel
                    <Shield className="ml-2 h-5 w-5" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
