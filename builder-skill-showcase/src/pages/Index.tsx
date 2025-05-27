import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Trophy, Users, Zap, Target, Star, Award, Code2, Calendar, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { SampleDataCreator } from "@/components/admin/SampleDataCreator";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Challenge {
  id: string;
  title: string;
  description: string;
  company_name: string;
  domains: string[];
  prize_amount: number;
  prize_description: string;
  submission_deadline: string;
  status: string;
  created_at: string;
  image_url: string;
}

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAdminTools, setShowAdminTools] = useState(false);
  const [featuredChallenges, setFeaturedChallenges] = useState<Challenge[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);

  // Show admin tools if user email contains 'admin' or is a specific test email
  useEffect(() => {
    if (user?.email && (user.email.includes('admin') || user.email === 'test@example.com')) {
      setShowAdminTools(true);
    }
  }, [user]);

  // Fetch featured challenges
  useEffect(() => {
    fetchFeaturedChallenges();
  }, []);

  const fetchFeaturedChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('status', 'active')
        .order('prize_amount', { ascending: false })
        .limit(3);

      if (error) throw error;
      setFeaturedChallenges(data || []);
    } catch (error) {
      console.error('Error fetching featured challenges:', error);
    } finally {
      setLoadingChallenges(false);
    }
  };

  const formatPrize = (amount: number) => {
    if (!amount) return 'TBD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDeadline = (deadline: string) => {
    return new Date(deadline).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysLeft = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section - Foundry of Future AI Leaders */}
      <section className="relative section-spacing px-4">
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-5xl mx-auto content-spacing">
            {/* Elite Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 mb-6 animate-fade-in">
              <Star className="w-4 h-4" />
              <span>The Foundry of Future AI Leaders</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight animate-fade-in">
              Build the Future of{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Products
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed max-w-4xl mx-auto animate-fade-in">
              Join elite AI builders in solving real-world challenges. Compete for substantial prizes, 
              build cutting-edge prototypes, and shape the next generation of AI applications in our 
              prestigious innovation accelerator.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-scale-in">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-4 hover-lift font-semibold"
                onClick={() => navigate(user ? "/challenges" : "/auth")}
              >
                {user ? "Explore Challenges" : "Join as Builder"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 text-lg px-8 py-4 hover-lift font-medium"
                onClick={() => navigate("/challenges")}
              >
                View Challenges
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Challenges Section - Moved here */}
      <section className="section-spacing px-4 bg-white border-t border-gray-200">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Challenges</h2>
            <p className="text-xl text-gray-600">Discover the most exciting AI building opportunities</p>
          </div>

          {loadingChallenges ? (
            <div className="text-center text-gray-600">Loading challenges...</div>
          ) : featuredChallenges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {featuredChallenges.map((challenge) => {
                const daysLeft = getDaysLeft(challenge.submission_deadline);
                return (
                  <Card key={challenge.id} className="bg-white border-gray-200 hover:bg-gray-50 transition-all cursor-pointer shadow-sm hover:shadow-md group">
                {challenge.image_url && (
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                    <img
                      src={challenge.image_url}
                      alt={challenge.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Failed to load featured challenge image:', challenge.image_url);
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log('Featured challenge image loaded successfully:', challenge.image_url);
                      }}
                    />
                  </div>
                )}
                <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Active
                        </Badge>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900">
                            {formatPrize(challenge.prize_amount)}
                          </div>
                          {challenge.prize_description && (
                            <div className="text-gray-600 text-xs">{challenge.prize_description}</div>
                          )}
                        </div>
                      </div>
                      <CardTitle className="text-gray-900 text-lg mb-2 font-semibold group-hover:text-blue-600 transition-colors">
                        {challenge.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        by {challenge.company_name || 'Anonymous'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-700 text-sm leading-relaxed line-clamp-2">
                        {challenge.description}
                      </p>

                      {challenge.domains && challenge.domains.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {challenge.domains.slice(0, 2).map((domain, index) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                              {domain}
                            </Badge>
                          ))}
                          {challenge.domains.length > 2 && (
                            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                              +{challenge.domains.length - 2} more
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          Due: {formatDeadline(challenge.submission_deadline)}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          {daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}
                        </div>
                      </div>

                      <div className="pt-2">
                        <Button 
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                          onClick={() => navigate(`/challenges/${challenge.id}`)}
                        >
                          View Challenge
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-600">No active challenges available at the moment.</div>
          )}

          <div className="text-center">
            <Button 
              variant="outline" 
              size="lg"
              className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 text-lg px-8 py-4 hover-lift font-medium"
              onClick={() => navigate("/challenges")}
            >
              View All Challenges
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section - Why Elite Builders */}
      <section className="section-spacing px-4 bg-white border-t border-gray-200">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Elite Builders?</h2>
            <p className="text-xl text-gray-600">The premier platform for AI product development challenges</p>
          </div>

          <div className="elite-grid elite-grid-auto">
            <div className="text-center group hover-lift p-6 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Compete for Prizes</h3>
              <p className="text-gray-600 leading-relaxed">Win substantial cash prizes and recognition from top companies in the AI industry</p>
            </div>

            <div className="text-center group hover-lift p-6 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Build Real Solutions</h3>
              <p className="text-gray-600 leading-relaxed">Work on actual problems facing companies and organizations worldwide</p>
            </div>

            <div className="text-center group hover-lift p-6 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Elite Community</h3>
              <p className="text-gray-600 leading-relaxed">Connect with top AI developers and researchers from around the globe</p>
            </div>

            <div className="text-center group hover-lift p-6 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Skill Development</h3>
              <p className="text-gray-600 leading-relaxed">Advance your AI product development capabilities through real challenges</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Process Flow */}
      <section className="section-spacing px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple steps to start building and competing</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center p-8 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-2xl">
                1
              </div>
              <div className="flex justify-center mb-4">
                <Code2 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Choose a Challenge</h3>
              <p className="text-gray-600 leading-relaxed">Browse available challenges from leading companies and select one that matches your expertise and interests</p>
            </div>

            <div className="text-center p-8 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-2xl">
                2
              </div>
              <div className="flex justify-center mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Build Your Solution</h3>
              <p className="text-gray-600 leading-relaxed">Develop a working prototype, create a compelling pitch deck, and record a demonstration video</p>
            </div>

            <div className="text-center p-8 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-2xl">
                3
              </div>
              <div className="flex justify-center mb-4">
                <Award className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Win & Get Recognized</h3>
              <p className="text-gray-600 leading-relaxed">Submit your solution for expert judging and compete for prizes and career opportunities</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Call to Action */}
      <section className="section-spacing px-4 bg-blue-600">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-6">Ready to Build the Future?</h2>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Join thousands of elite AI builders competing in cutting-edge challenges. 
              Where innovation meets opportunity and potential becomes reality.
            </p>
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-50 text-lg px-8 py-6 hover-lift font-semibold"
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
        <section className="py-10 px-4 border-t border-gray-200 bg-gray-50">
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