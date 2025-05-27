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
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "judging":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "completed":
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
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
    // Navigate to challenge details page (we'll implement this next)
    navigate(`/challenges/${challengeId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <Header />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-white text-lg">Loading challenges...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">AI Building Challenges</h1>
          <p className="text-white/80 text-lg">Showcase your AI product development skills and compete for prizes</p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-white/60" />
              <Input
                placeholder="Search challenges, companies, or technologies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
            </div>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
            >
              {domains.map(domain => (
                <option key={domain.value} value={domain.value} className="bg-slate-900">
                  {domain.label}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
            >
              {statuses.map(status => (
                <option key={status.value} value={status.value} className="bg-slate-900">
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-white/80">
            Showing {filteredChallenges.length} challenge{filteredChallenges.length !== 1 ? 's' : ''}
            {searchTerm && ` for "${searchTerm}"`}
          </p>
        </div>

        {/* Challenge Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredChallenges.map((challenge) => {
            const daysLeft = getDaysLeft(challenge.submission_deadline);
            return (
              <Card key={challenge.id} className="bg-white/10 border-white/20 hover:bg-white/15 transition-all cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={getStatusColor(challenge.status)}>
                      {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
                    </Badge>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {formatPrize(challenge.prize_amount)}
                      </div>
                      {challenge.prize_description && (
                        <div className="text-white/60 text-sm">{challenge.prize_description}</div>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-white text-xl mb-2">{challenge.title}</CardTitle>
                  <CardDescription className="text-white/70">
                    by {challenge.company_name || 'Anonymous'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-white/80">{challenge.description}</p>
                  
                  {challenge.domains && challenge.domains.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {challenge.domains.map((domain) => (
                        <Badge key={domain} variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                          {domain}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-white/60">
                      <Calendar className="h-4 w-4 mr-2" />
                      Due: {formatDeadline(challenge.submission_deadline)}
                    </div>
                    <div className="flex items-center text-white/60">
                      <Clock className="h-4 w-4 mr-2" />
                      {daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      disabled={challenge.status === "completed" || daysLeft <= 0}
                      onClick={() => handleJoinChallenge(challenge.id)}
                    >
                      {challenge.status === "active" ? "Join Challenge" : 
                       challenge.status === "judging" ? "View Results" : "View Details"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredChallenges.length === 0 && (
          <div className="text-center py-12">
            <div className="text-white/60 text-lg">No challenges found matching your criteria.</div>
            <Button 
              onClick={() => {
                setSearchTerm("");
                setSelectedDomain("all");
                setSelectedStatus("all");
              }}
              variant="outline" 
              className="mt-4 border-white/20 text-white hover:bg-white/10"
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
