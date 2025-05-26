
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Star, Trophy, Users, Zap, Code, Brain, Rocket, Shield, Target, Award, ChevronRight, Building2, Clock, DollarSign } from "lucide-react";
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
      description: "Cutting-edge AI problems that push the boundaries of innovation and technology",
      color: "text-[#FF6600]"
    },
    {
      icon: Trophy,
      title: "Premium Rewards",
      description: "Substantial prizes and recognition for outstanding AI innovations and solutions",
      color: "text-[#336699]"
    },
    {
      icon: Code,
      title: "Real-World Impact",
      description: "Build solutions that matter and shape the future of artificial intelligence",
      color: "text-[#003366]"
    },
    {
      icon: Users,
      title: "Elite Community",
      description: "Connect with top-tier AI builders, researchers, and industry leaders",
      color: "text-[#FF6600]"
    }
  ];

  const stats = [
    { number: "10K+", label: "Elite Builders", icon: Users, color: "text-[#336699]" },
    { number: "$500K+", label: "Total Prizes", icon: DollarSign, color: "text-[#FF6600]" },
    { number: "95%", label: "Success Rate", icon: Target, color: "text-[#003366]" },
    { number: "24/7", label: "AI Support", icon: Shield, color: "text-[#336699]" }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "AI Engineer at Google",
      content: "EliteBuilders challenges pushed me to think beyond conventional AI approaches. The platform is exceptional.",
      avatar: "SC"
    },
    {
      name: "Marcus Rodriguez",
      role: "ML Researcher at OpenAI",
      content: "The quality of challenges and community engagement here is unmatched. Highly recommend for serious AI builders.",
      avatar: "MR"
    },
    {
      name: "Dr. Aisha Patel",
      role: "CTO at TechCorp",
      content: "We've discovered amazing talent through EliteBuilders. The caliber of participants is truly elite.",
      avatar: "AP"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5] page-enter">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-[#003366] to-[#336699] text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-[#FF6600] rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="elite-container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Elite Badge */}
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-8 border border-white/20">
              <Star className="w-5 h-5 text-[#FF6600]" />
              <span className="font-['Open_Sans'] font-semibold">The Future of AI Innovation</span>
              <Zap className="w-5 h-5 text-[#FF6600]" />
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight font-['Montserrat']">
              Build Tomorrow's{" "}
              <span className="block text-[#FF6600]">
                AI Revolution
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-12 leading-relaxed max-w-3xl mx-auto font-['Open_Sans']">
              Join the most exclusive AI builders community. Compete in cutting-edge challenges, 
              earn substantial rewards, and build the future of artificial intelligence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Button 
                size="lg" 
                className="text-lg px-8 py-4 bg-[#FF6600] hover:bg-[#e55a00] group"
                onClick={() => navigate(user ? "/challenges" : "/auth")}
              >
                {user ? "Explore Challenges" : "Join Elite Builders"}
                <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-4 border-white/30 text-white hover:bg-white hover:text-[#003366] group"
                onClick={() => navigate("/challenges")}
              >
                View Live Challenges
                <ChevronRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="elite-card bg-white/10 backdrop-blur-sm border-white/20 text-center hover:bg-white/20">
                  <CardContent className="p-6">
                    <stat.icon className={`h-8 w-8 mx-auto mb-3 ${stat.color}`} />
                    <div className="text-3xl font-black text-white mb-2 font-['Montserrat']">{stat.number}</div>
                    <div className="text-white/80 font-semibold font-['Open_Sans']">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="elite-container">
          <div className="text-center mb-16">
            <Badge variant="accent" className="mb-6">
              <Rocket className="w-4 h-4 mr-2" />
              Revolutionary Platform
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black text-[#003366] mb-6 font-['Montserrat']">
              Why Elite Builders Choose Us
            </h2>
            <p className="text-xl text-[#666666] max-w-3xl mx-auto font-['Open_Sans'] leading-relaxed">
              Experience the most advanced AI challenge platform designed for tomorrow's innovators
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="elite-card group text-center h-full">
                <CardHeader className="pb-4">
                  <div className="mx-auto mb-4 p-4 rounded-xl bg-[#F5F5F5] w-fit group-hover:bg-[#003366] transition-colors duration-300">
                    <feature.icon className={`h-8 w-8 ${feature.color} group-hover:text-white transition-colors duration-300`} />
                  </div>
                  <CardTitle className="text-xl text-[#003366] group-hover:text-[#FF6600] transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-[#666666] leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-[#F5F5F5]">
        <div className="elite-container">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-6">
              <Users className="w-4 h-4 mr-2" />
              Community Voices
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black text-[#003366] mb-6 font-['Montserrat']">
              What Our Elite Builders Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="elite-card p-8 text-center">
                <CardContent className="space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#003366] text-white flex items-center justify-center text-xl font-bold mx-auto font-['Montserrat']">
                    {testimonial.avatar}
                  </div>
                  <p className="text-[#333333] italic leading-relaxed font-['Open_Sans']">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <p className="font-semibold text-[#003366] font-['Montserrat']">{testimonial.name}</p>
                    <p className="text-sm text-[#666666] font-['Open_Sans']">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-[#003366] text-white">
        <div className="elite-container text-center">
          <Card className="elite-card max-w-4xl mx-auto bg-[#336699] border-[#336699] text-white">
            <CardContent className="p-12">
              <div className="flex justify-center mb-6">
                <Badge variant="accent">
                  <Award className="w-4 h-4 mr-2" />
                  Limited Access
                </Badge>
              </div>
              <h3 className="text-4xl md:text-5xl font-black text-white mb-6 font-['Montserrat']">
                Ready to Build the Future?
              </h3>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto font-['Open_Sans'] leading-relaxed">
                Join thousands of elite AI builders who are already shaping tomorrow's technology. 
                Your next breakthrough starts here.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-4 bg-[#FF6600] hover:bg-[#e55a00]"
                  onClick={() => navigate(user ? "/dashboard" : "/auth")}
                >
                  {user ? "Go to Dashboard" : "Start Building Now"}
                  <Rocket className="ml-2 h-5 w-5" />
                </Button>
                {showAdminTools && (
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="text-lg px-8 py-4 border-white/30 text-white hover:bg-white hover:text-[#003366]"
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

      {/* Footer */}
      <footer className="py-8 px-4 bg-[#003366] border-t border-white/10">
        <div className="elite-container">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-lg bg-[#FF6600] flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-white font-bold font-['Montserrat']">EliteBuilders</span>
            </div>
            <p className="text-white/70 text-sm font-['Open_Sans']">
              © 2024 EliteBuilders. Building the future of AI, one challenge at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
