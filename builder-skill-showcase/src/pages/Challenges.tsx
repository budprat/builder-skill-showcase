
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Calendar, User, Trophy, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { useToast } from "@/hooks/use-toast";

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
}

const Challenges = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const domains = [
    { value: "all", label: "All Skills" },
    { value: "nlp", label: "NLP" },
    { value: "cv", label: "Computer Vision" },
    { value: "ml", label: "Machine Learning" },
    { value: "healthcare", label: "Data Science" },
    { value: "fintech", label: "FinTech" },
    { value: "edtech", label: "EdTech" },
    { value: "iot", label: "IoT" },
    { value: "ecommerce", label: "E-commerce" }
  ];

  const statuses = [
    { value: "all", label: "All Challenges" },
    { value: "active", label: "Active" },
    { value: "judging", label: "Upcoming" },
    { value: "completed", label: "Completed" }
  ];

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      toast({
        title: "Error",
        description: "Failed to load challenges. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredChallenges = challenges.filter(challenge => {
    const matchesSearch = challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         challenge.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         challenge.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDomain = selectedDomain === "all" || challenge.domains?.some(domain => 
      domain.toLowerCase().includes(selectedDomain.toLowerCase())
    );
    const matchesStatus = selectedStatus === "all" || challenge.status === selectedStatus;
    
    return matchesSearch && matchesDomain && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "judging":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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

  const handleJoinChallenge = (challengeId: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    navigate(`/challenges/${challengeId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-gray-600 text-lg">Loading challenges...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="container mx-auto px-4 sm:px-5 lg:px-6 py-8" role="main">
        {/* Page Header */}
        <header className="mb-8">
          <h1 className="text-4xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">Challenges</h1>
          <p className="text-gray-600 text-lg sm:text-base">Explore challenges and compete to win prizes and recognition.</p>
        </header>

        {/* Filter Section */}
        <section className="mb-8" aria-label="Challenge filters">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" 
                aria-hidden="true"
              />
              <Input
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                aria-label="Search challenges"
              />
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="space-y-4">
            {/* Status Filters */}
            <div className="flex flex-wrap gap-2">
              {statuses.map(status => (
                <Button
                  key={status.value}
                  variant={selectedStatus === status.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStatus(status.value)}
                  className={`
                    transition-all duration-200 text-sm font-medium px-4 py-2
                    ${selectedStatus === status.value 
                      ? "bg-gray-900 text-white hover:bg-gray-800" 
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                  aria-pressed={selectedStatus === status.value}
                >
                  {status.label}
                </Button>
              ))}
            </div>

            {/* Domain Filters */}
            <div className="flex flex-wrap gap-2">
              {domains.map(domain => (
                <Button
                  key={domain.value}
                  variant={selectedDomain === domain.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDomain(domain.value)}
                  className={`
                    transition-all duration-200 text-sm font-medium px-4 py-2
                    ${selectedDomain === domain.value 
                      ? "bg-gray-900 text-white hover:bg-gray-800" 
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                  aria-pressed={selectedDomain === domain.value}
                >
                  {domain.label}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Active Challenges Section */}
        <section className="mb-12" aria-labelledby="active-challenges">
          <h2 id="active-challenges" className="text-2xl sm:text-xl md:text-2xl font-bold text-gray-900 mb-6">
            Active Challenges
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges
              .filter(challenge => challenge.status === 'active')
              .map((challenge) => {
                const daysLeft = getDaysLeft(challenge.submission_deadline);
                return (
                  <Card 
                    key={challenge.id} 
                    className="bg-white border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
                    tabIndex={0}
                    role="article"
                    aria-labelledby={`challenge-title-${challenge.id}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleJoinChallenge(challenge.id);
                      }
                    }}
                  >
                    <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
                      <div className="absolute top-4 left-4">
                        <span className="text-xs text-gray-600 font-medium">
                          Sponsored by {challenge.company_name || 'Anonymous'}
                        </span>
                      </div>
                    </div>
                    
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={getStatusColor(challenge.status)}>
                          {challenge.status === 'active' ? 'Active' : challenge.status}
                        </Badge>
                      </div>
                      <CardTitle 
                        id={`challenge-title-${challenge.id}`}
                        className="text-gray-900 text-lg font-bold line-clamp-2 group-hover:text-blue-600 transition-colors duration-200"
                      >
                        {challenge.title}
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <CardDescription className="text-gray-600 line-clamp-2">
                        {challenge.description}
                      </CardDescription>
                      
                      {challenge.domains && challenge.domains.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {challenge.domains.slice(0, 2).map((domain) => (
                            <Badge 
                              key={domain} 
                              variant="secondary" 
                              className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                            >
                              {domain}
                            </Badge>
                          ))}
                          {challenge.domains.length > 2 && (
                            <Badge variant="secondary" className="bg-gray-50 text-gray-600 border-gray-200 text-xs">
                              +{challenge.domains.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="pt-4 border-t border-gray-100">
                        <Button 
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors duration-200"
                          disabled={challenge.status === "completed" || daysLeft <= 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinChallenge(challenge.id);
                          }}
                          aria-label={`View details for ${challenge.title}`}
                        >
                          View Challenge
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </section>

        {/* Upcoming Challenges Section */}
        <section aria-labelledby="upcoming-challenges">
          <h2 id="upcoming-challenges" className="text-2xl sm:text-xl md:text-2xl font-bold text-gray-900 mb-6">
            Upcoming Challenges
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges
              .filter(challenge => challenge.status === 'judging')
              .map((challenge) => {
                return (
                  <Card 
                    key={challenge.id} 
                    className="bg-white border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
                    tabIndex={0}
                    role="article"
                    aria-labelledby={`upcoming-challenge-title-${challenge.id}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleJoinChallenge(challenge.id);
                      }
                    }}
                  >
                    <div className="relative h-48 bg-gradient-to-br from-yellow-100 to-orange-200 rounded-t-lg overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10"></div>
                      <div className="absolute top-4 left-4">
                        <span className="text-xs text-gray-600 font-medium">
                          Sponsored by {challenge.company_name || 'Anonymous'}
                        </span>
                      </div>
                    </div>
                    
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={getStatusColor(challenge.status)}>
                          Upcoming
                        </Badge>
                      </div>
                      <CardTitle 
                        id={`upcoming-challenge-title-${challenge.id}`}
                        className="text-gray-900 text-lg font-bold line-clamp-2 group-hover:text-blue-600 transition-colors duration-200"
                      >
                        {challenge.title}
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <CardDescription className="text-gray-600 line-clamp-2">
                        {challenge.description}
                      </CardDescription>
                      
                      <div className="pt-4 border-t border-gray-100">
                        <Button 
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinChallenge(challenge.id);
                          }}
                          aria-label={`View details for ${challenge.title}`}
                        >
                          View Challenge
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </section>

        {/* No Results */}
        {filteredChallenges.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No challenges found matching your criteria.</div>
            <Button 
              onClick={() => {
                setSearchTerm("");
                setSelectedDomain("all");
                setSelectedStatus("all");
              }}
              variant="outline" 
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Challenges;
