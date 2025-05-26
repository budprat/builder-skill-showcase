
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { 
  Star, 
  Zap, 
  Trophy, 
  Code2, 
  Brain, 
  Rocket,
  ChevronRight,
  Users,
  Target,
  Award,
  Globe,
  Sparkles
} from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAdminTools, setShowAdminTools] = useState(false);

  // Matrix rain effect
  useEffect(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.className = 'matrix-rain';
    document.body.appendChild(canvas);

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*(){}[]|;:,.<>?/~`';
    const charSize = 14;
    const columns = canvas.width / charSize;
    const drops: number[] = [];

    for (let i = 0; i < columns; i++) {
      drops[i] = 1;
    }

    const draw = () => {
      if (!ctx) return;
      
      ctx.fillStyle = 'rgba(10, 10, 10, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#00D9FF';
      ctx.font = `${charSize}px Orbitron`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * charSize, drops[i] * charSize);

        if (drops[i] * charSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);

    return () => {
      clearInterval(interval);
      document.body.removeChild(canvas);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Show admin tools if user email contains 'admin' or is a specific test email
  useEffect(() => {
    if (user?.email && (user.email.includes('admin') || user.email === 'test@example.com')) {
      setShowAdminTools(true);
    }
  }, [user]);

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Challenges",
      description: "Build cutting-edge AI applications with real-world impact",
      color: "cyber-electric-blue"
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: "Elite Competition",
      description: "Compete with the world's top AI developers and engineers",
      color: "cyber-neon-pink"
    },
    {
      icon: <Code2 className="w-8 h-8" />,
      title: "Future Tech Stack",
      description: "Work with the latest AI frameworks and emerging technologies",
      color: "cyber-lime-green"
    },
    {
      icon: <Rocket className="w-8 h-8" />,
      title: "Career Acceleration",
      description: "Launch your career into the AI revolution",
      color: "cyber-purple"
    }
  ];

  const stats = [
    { label: "Active Builders", value: "10K+", icon: <Users className="w-6 h-6" /> },
    { label: "AI Challenges", value: "50+", icon: <Target className="w-6 h-6" /> },
    { label: "Winners Placed", value: "95%", icon: <Award className="w-6 h-6" /> },
    { label: "Global Reach", value: "120+", icon: <Globe className="w-6 h-6" /> }
  ];

  return (
    <div className="min-h-screen bg-cyber-black relative overflow-hidden">
      <Header />
      
      {/* Hero Section */}
      <section className="relative section-spacing px-4 pt-32">
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-5xl mx-auto content-spacing">
            {/* Elite Badge */}
            <div className="inline-flex items-center gap-2 cyber-badge mb-8 animate-pulse">
              <Sparkles className="w-4 h-4" />
              <span>The Foundry of Future AI Leaders</span>
            </div>

            {/* Main Heading with Glitch Effect */}
            <h1 className="text-6xl lg:text-8xl font-orbitron font-black tracking-wider mb-8 leading-tight">
              <span className="text-cyber-white">ELITE</span>
              <span className="text-cyber-electric-blue neon-glow-blue">BUILDERS</span>
              <br />
              <span className="text-cyber-neon-pink neon-glow-pink text-4xl lg:text-6xl">
                AI REVOLUTION
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl lg:text-2xl text-cyber-white/80 mb-12 max-w-3xl mx-auto font-rajdhani font-medium leading-relaxed">
              Join the most <span className="text-cyber-electric-blue font-bold">exclusive AI building competition</span> on the planet. 
              Build. Compete. <span className="text-cyber-neon-pink font-bold">Ascend.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
              <Button
                size="lg"
                onClick={() => navigate(user ? '/challenges' : '/auth')}
                className="cyber-button text-lg px-8 py-4 group"
              >
                <Zap className="w-5 h-5 group-hover:text-cyber-neon-pink transition-colors" />
                {user ? 'Enter Arena' : 'Join Elite'}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/challenges')}
                className="text-lg px-8 py-4"
              >
                <Code2 className="w-5 h-5" />
                View Challenges
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {stats.map((stat, index) => (
                <div key={index} className="cyber-card p-6 text-center group hover:scale-105 transition-transform">
                  <div className="text-cyber-electric-blue mb-2 flex justify-center group-hover:text-cyber-neon-pink transition-colors">
                    {stat.icon}
                  </div>
                  <div className="text-3xl font-orbitron font-bold text-cyber-white mb-1 group-hover:text-cyber-electric-blue transition-colors">
                    {stat.value}
                  </div>
                  <div className="text-sm text-cyber-white/70 font-rajdhani">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-10 w-20 h-20 border border-cyber-electric-blue/30 rotate-45 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 border border-cyber-neon-pink/30 rotate-12 animate-bounce"></div>
        <div className="absolute bottom-40 left-20 w-24 h-24 border border-cyber-lime-green/30 rotate-45 animate-pulse"></div>
      </section>

      {/* Features Section */}
      <section className="section-spacing px-4 bg-cyber-dark-gray/20 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-6xl font-orbitron font-bold mb-6 text-cyber-white">
              WHY <span className="text-cyber-electric-blue">ELITE</span>BUILDERS?
            </h2>
            <p className="text-xl text-cyber-white/70 max-w-2xl mx-auto font-rajdhani">
              The premier platform where AI visionaries forge the future
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:scale-105 transition-all duration-300 h-full">
                <CardHeader className="text-center pb-4">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyber-dark-gray border border-${feature.color}/50 mb-4 mx-auto group-hover:border-${feature.color} transition-all neon-glow-blue group-hover:scale-110`}>
                    <div className={`text-${feature.color} group-hover:scale-110 transition-transform`}>
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl mb-3 group-hover:text-cyber-electric-blue transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-cyber-white/70 font-rajdhani text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-spacing px-4">
        <div className="container mx-auto text-center">
          <div className="cyber-card p-12 max-w-4xl mx-auto relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-5xl font-orbitron font-bold mb-6 text-cyber-white">
                READY TO <span className="text-cyber-neon-pink">ASCEND</span>?
              </h2>
              <p className="text-xl text-cyber-white/80 mb-8 font-rajdhani max-w-2xl mx-auto">
                Join the elite ranks of AI builders shaping tomorrow's technology landscape
              </p>
              <Button
                size="lg"
                onClick={() => navigate(user ? '/challenges' : '/auth')}
                className="cyber-button text-xl px-12 py-6 group"
              >
                <Star className="w-6 h-6 group-hover:text-cyber-lime-green transition-colors" />
                {user ? 'Access Challenges' : 'Begin Journey'}
                <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </Button>
            </div>
            
            {/* Background grid overlay */}
            <div className="absolute inset-0 opacity-10">
              <div className="w-full h-full" style={{
                backgroundImage: `
                  linear-gradient(rgba(0, 217, 255, 0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0, 217, 255, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Tools (if applicable) */}
      {showAdminTools && (
        <section className="section-spacing px-4 border-t border-cyber-electric-blue/30">
          <div className="container mx-auto text-center">
            <Badge variant="destructive" className="mb-4">
              ADMIN ACCESS DETECTED
            </Badge>
            <h3 className="text-2xl font-orbitron font-bold mb-6 text-cyber-white">
              SYSTEM <span className="text-cyber-electric-blue">ADMINISTRATION</span>
            </h3>
            <Button
              variant="outline"
              onClick={() => navigate('/admin')}
              className="group"
            >
              <Code2 className="w-5 h-5 group-hover:text-cyber-neon-pink transition-colors" />
              Access Control Panel
            </Button>
          </div>
        </section>
      )}
    </div>
  );
};

export default Index;
