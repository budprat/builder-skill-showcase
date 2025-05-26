
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Clock, Toggle } from "lucide-react";
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
    { value: "all", label: "All Domains" },
    { value: "nlp", label: "Natural Language Processing" },
    { value: "cv", label: "Computer Vision" },
    { value: "ml", label: "Machine Learning" },
    { value: "healthcare", label: "Healthcare AI" },
    { value: "fintech", label: "FinTech AI" },
    { value: "edtech", label: "EdTech AI" },
    { value: "iot", label: "IoT AI" },
    { value: "ecommerce", label: "E-commerce AI" }
  ];

  const statuses = [
    { value: "all", label: "All Statuses" },
    { value: "active", label: "Active" },
    { value: "judging", label: "Judging" },
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
        return "bg-emerald-500 text-white";
      case "judging":
        return "bg-yellow-500 text-white";
      case "completed":
        return "bg-gray-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const formatPrize = (amount: number) => {
    if (!amount) return '$0';
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

  const getDomainTagColor = (domain: string) => {
    const colorMap: { [key: string]: string } = {
      'Computer Vision': 'bg-gradient-to-r from-purple-500 to-blue-500',
      'Healthcare AI': 'bg-gradient-to-r from-green-500 to-teal-500',
      'Deep Learning': 'bg-gradient-to-r from-blue-500 to-purple-500',
      'Natural Language Processing': 'bg-gradient-to-r from-pink-500 to-purple-500',
      'Machine Learning': 'bg-gradient-to-r from-indigo-500 to-blue-500',
    };
    return colorMap[domain] || 'bg-slate-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-purple-900">
        <Header />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-white text-lg">Loading challenges...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-purple-900" style={{fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif'}}>
      <Header />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">AI Building Challenges</h1>
          <p className="text-lg text-slate-300 mb-6">Showcase your AI product development skills and compete for prizes</p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          {/* Search Bar */}
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search challenges, companies, or technologies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 rounded-lg focus:border-purple-500 focus:ring-purple-500"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-6 py-3 text-white focus:border-purple-500 focus:ring-purple-500 min-w-40"
            >
              {domains.map(domain => (
                <option key={domain.value} value={domain.value} className="bg-slate-800">
                  {domain.label}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-6 py-3 text-white focus:border-purple-500 focus:ring-purple-500 min-w-40"
            >
              {statuses.map(status => (
                <option key={status.value} value={status.value} className="bg-slate-800">
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-8">
          <p className="text-sm text-slate-400">
            Showing {filteredChallenges.length} challenge{filteredChallenges.length !== 1 ? 's' : ''}
            {searchTerm && ` for "${searchTerm}"`}
          </p>
        </div>

        {/* Challenge Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredChallenges.map((challenge) => {
            const daysLeft = getDaysLeft(challenge.submission_deadline);
            return (
              <Card key={challenge.id} className="bg-slate-800 border-slate-700 hover:bg-slate-750 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 cursor-pointer rounded-2xl p-6">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <Badge className={`${getStatusColor(challenge.status)} px-2 py-1 text-xs font-medium rounded`}>
                      {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
                    </Badge>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {formatPrize(challenge.prize_amount)}
                      </div>
                      {challenge.prize_description && (
                        <div className="text-orange-400 text-sm font-medium">{challenge.prize_description}</div>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-white text-xl font-semibold mb-2">{challenge.title}</CardTitle>
                  <CardDescription className="text-slate-400 text-sm">
                    by {challenge.company_name || 'Anonymous'}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-slate-300 text-sm leading-relaxed line-clamp-3">{challenge.description}</p>
                  
                  {challenge.domains && challenge.domains.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {challenge.domains.map((domain) => (
                        <Badge 
                          key={domain} 
                          className={`${getDomainTagColor(domain)} text-white text-xs px-3 py-1 rounded-full border-0`}
                        >
                          {domain}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm text-slate-400">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Due: {formatDeadline(challenge.submission_deadline)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2.5 rounded-lg transition-all duration-300"
                      disabled={challenge.status === "completed" || daysLeft <= 0}
                      onClick={() => handleJoinChallenge(challenge.id)}
                    >
                      {challenge.status === "active" ? "Join Challenge" : 
                       challenge.status === "judging" ? "View Results" : "View Details"}
                    </Button>
                    
                    {/* Toggle Switch */}
                    <div className="relative inline-block w-12 h-6">
                      <input
                        type="checkbox"
                        className="sr-only"
                        defaultChecked={false}
                      />
                      <div className="block bg-slate-600 w-12 h-6 rounded-full cursor-pointer transition-colors duration-300"></div>
                      <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredChallenges.length === 0 && (
          <div className="text-center py-16">
            <div className="text-slate-400 text-lg mb-4">No challenges found matching your criteria.</div>
            <Button 
              onClick={() => {
                setSearchTerm("");
                setSelectedDomain("all");
                setSelectedStatus("all");
              }}
              variant="outline" 
              className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Challenges;
