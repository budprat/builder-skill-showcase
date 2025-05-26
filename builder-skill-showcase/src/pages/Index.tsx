
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { 
  Brain, 
  Code, 
  Trophy, 
  Users, 
  Zap, 
  Star,
  ArrowRight,
  CheckCircle,
  Target,
  Award,
  Lightbulb
} from "lucide-react";

export default function Index() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Challenges",
      description: "Take on cutting-edge AI challenges designed by industry experts to push your skills to the limit."
    },
    {
      icon: Code,
      title: "Real-World Projects",
      description: "Build practical AI solutions that solve actual business problems and showcase your expertise."
    },
    {
      icon: Trophy,
      title: "Elite Recognition",
      description: "Earn prestigious badges and certificates that demonstrate your AI mastery to employers worldwide."
    },
    {
      icon: Users,
      title: "Expert Community",
      description: "Connect with top AI developers, get mentorship, and collaborate on groundbreaking projects."
    }
  ];

  const stats = [
    { number: "10,000+", label: "Developers" },
    { number: "500+", label: "Challenges" },
    { number: "50+", label: "Companies" },
    { number: "95%", label: "Success Rate" }
  ];

  const benefits = [
    "Industry-recognized certifications",
    "Direct hiring pipeline to top companies",
    "Exclusive access to AI tools and resources",
    "Monthly challenges with cash prizes",
    "Personalized learning paths",
    "24/7 expert mentorship"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="elite-section bg-white">
        <div className="elite-container">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 elite-badge-accent mb-6">
              <Star className="w-4 h-4" />
              The Future of AI Development
              <Zap className="w-4 h-4" />
            </div>
            
            <h1 className="mb-6">
              Master AI Development with<br />
              <span className="text-elite-orange">EliteBuilders</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Join the world's most exclusive AI development platform. Take on real-world challenges, 
              build cutting-edge solutions, and fast-track your career with top tech companies.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/challenges">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Building <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Join Elite Community
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="elite-section bg-elite-light">
        <div className="elite-container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-elite-blue mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="elite-section">
        <div className="elite-container">
          <div className="text-center mb-16">
            <h2 className="mb-4">Why Choose EliteBuilders?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We've created the most comprehensive platform for AI developers to showcase their skills, 
              learn from experts, and connect with leading companies.
            </p>
          </div>
          
          <div className="elite-grid">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-elite-orange rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="elite-section bg-elite-light">
        <div className="elite-container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="accent" className="mb-4">Premium Benefits</Badge>
              <h2 className="mb-6">Unlock Your AI Career Potential</h2>
              <p className="text-lg text-gray-600 mb-8">
                EliteBuilders isn't just a platform—it's your gateway to the most prestigious 
                opportunities in AI development. Our comprehensive program ensures you're ready 
                for the future of technology.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Target className="w-6 h-6 text-elite-orange" />
                    <CardTitle>Skill-Based Matching</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Our AI matches your skills with the perfect challenges and career opportunities.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Award className="w-6 h-6 text-elite-blue" />
                    <CardTitle>Industry Recognition</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Earn certificates and badges recognized by Fortune 500 companies worldwide.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Lightbulb className="w-6 h-6 text-yellow-500" />
                    <CardTitle>Innovation Focus</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Work on breakthrough AI projects that shape the future of technology.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="elite-section bg-elite-blue text-white">
        <div className="elite-container text-center">
          <h2 className="mb-4 text-white">Ready to Join the Elite?</h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Take the first step towards becoming an AI elite. Start with our beginner-friendly 
            challenges or dive into advanced projects that will challenge your expertise.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/challenges">
              <Button size="lg" variant="default" className="w-full sm:w-auto bg-elite-orange hover:bg-orange-600">
                View Challenges <Trophy className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-elite-blue">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="elite-container">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-8 bg-elite-orange rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">EliteBuilders</span>
            </div>
            <p className="text-gray-400 mb-6">Building the future of AI, one developer at a time.</p>
            <div className="flex justify-center space-x-6 text-sm text-gray-400">
              <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white">Terms of Service</Link>
              <Link to="/contact" className="hover:text-white">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
