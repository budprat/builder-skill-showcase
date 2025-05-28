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
  image_url?: string;
  image_urls?: any;
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
    if (user !== undefined) {
      fetchChallenges();
    }
  }, [user]);

  const fetchChallenges = async () => {
    try {
      console.log('=== CHALLENGES PAGE FETCH ===');
      console.log('Current user:', user?.id);
      
      // Get current user's role
      let userRole = null;
      if (user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        userRole = roleData?.role;
      }
      
      console.log('User role in Challenges page:', userRole);
      
      let query = supabase.from('challenges').select('*');
      
      // Apply role-based filtering
      if (userRole === 'sponsor' || userRole === 'company') {
        // Sponsors should only see their own challenges
        query = query.eq('company_id', user.id);
        console.log('Filtering challenges for sponsor/company:', user.id);
      } else {
        // Other users see all active challenges
        query = query.eq('status', 'active');
        console.log('Showing active challenges for non-sponsor user');
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

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
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
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
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-gray-700 text-lg">Loading challenges...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Building Challenges</h1>
          <p className="text-gray-600 text-lg">Showcase your AI product development skills and compete for prizes</p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search challenges, companies, or technologies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500"
              />
            </div>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:border-blue-500"
            >
              {domains.map(domain => (
                <option key={domain.value} value={domain.value} className="bg-white">
                  {domain.label}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:border-blue-500"
            >
              {statuses.map(status => (
                <option key={status.value} value={status.value} className="bg-white">
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredChallenges.length} challenge{filteredChallenges.length !== 1 ? 's' : ''}
            {searchTerm && ` for "${searchTerm}"`}
          </p>
        </div>

        {/* Challenge Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredChallenges.map((challenge) => {
            const daysLeft = getDaysLeft(challenge.submission_deadline);
            return (
              <Card key={challenge.id} className="bg-white border-gray-200 hover:bg-gray-50 transition-all cursor-pointer shadow-sm hover:shadow-md" onClick={() => handleJoinChallenge(challenge.id)}>
                {challenge.image_url && (
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-t-lg relative">
                    <img
                      src={challenge.image_url}
                      alt={challenge.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Failed to load challenge image:', challenge.image_url);
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log('Challenge image loaded successfully:', challenge.image_url);
                      }}
                    />
                    <Badge className={`absolute top-1 left-1 text-xs ${getStatusColor(challenge.status)}`}>
                      {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-1 p-3">
                  <div className="flex items-start justify-between mb-1">
                    {!challenge.image_url && (
                      <Badge className={`text-xs ${getStatusColor(challenge.status)}`}>
                        {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
                      </Badge>
                    )}
                    <div className="text-right ml-auto">
                      <div className="text-sm font-bold text-gray-900">
                        {formatPrize(challenge.prize_amount)}
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-gray-900 text-sm mb-1 font-semibold line-clamp-2">{challenge.title}</CardTitle>
                  <CardDescription className="text-gray-600 text-xs">
                    {challenge.company_name || 'Anonymous'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 pt-0 p-3">
                  {challenge.domains && challenge.domains.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {challenge.domains.slice(0, 1).map((domain) => (
                        <Badge key={domain} variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 text-xs px-1 py-0">
                          {domain}
                        </Badge>
                      ))}
                      {challenge.domains.length > 1 && (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-200 text-xs px-1 py-0">
                          +{challenge.domains.length - 1}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-gray-600">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}
                    </div>
                  </div>

                  <div className="pt-1">
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs py-1"
                      disabled={challenge.status === "completed" || daysLeft <= 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinChallenge(challenge.id);
                      }}
                    >
                      {challenge.status === "active" ? "Join" : 
                       challenge.status === "judging" ? "Results" : "View"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredChallenges.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-600 text-lg">No challenges found matching your criteria.</div>
            <Button 
              onClick={() => {
                setSearchTerm("");
                setSelectedDomain("all");
                setSelectedStatus("all");
              }}
              variant="outline" 
              className="mt-4 border-gray-300 text-gray-700 hover:bg-gray-50"
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