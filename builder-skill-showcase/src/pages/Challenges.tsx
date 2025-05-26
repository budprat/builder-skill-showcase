
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Calendar, User, Trophy, Clock, ChevronDown } from "lucide-react";
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
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const statusFilters = [
    { value: "all", label: "All Challenges" },
    { value: "active", label: "Active" }
  ];

  const domainTabs = [
    { value: "upcoming", label: "Upcoming" },
    { value: "all", label: "All Skills" },
    { value: "healthcare", label: "Healthcare AI" },
    { value: "deeplearning", label: "Deeplearning" },
    { value: "nlp", label: "NLP" },
    { value: "cv", label: "Computer Vision" },
    { value: "ml", label: "Machine Learning" },
    { value: "data", label: "Data Science" }
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
    const matchesStatus = selectedStatus === "all" || challenge.status === selectedStatus;
    const matchesDomain = selectedDomain === "all" || selectedDomain === "upcoming" || 
                         challenge.domains?.some(domain => 
                           domain.toLowerCase().includes(selectedDomain.toLowerCase())
                         );
    
    return matchesSearch && matchesStatus && matchesDomain;
  });

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
        <div className="container mx-auto px-6 py-8 flex items-center justify-center">
          <div className="text-gray-600 text-lg">Loading challenges...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", sans-serif' }}>
      <Header />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ letterSpacing: '-0.02em' }}>
            Challenges
          </h1>
          <p className="text-base text-gray-500 mb-8">
            Explore challenges and compete to win prizes and recognition
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row gap-3 mb-8">
          {/* Search and Status Filters */}
          <div className="flex gap-3 flex-1">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search challenges..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9 bg-gray-100 border-0 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Status Filters */}
            <div className="flex gap-3">
              {statusFilters.map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setSelectedStatus(filter.value)}
                  className={`h-9 px-4 text-sm font-medium rounded-md border transition-colors ${
                    selectedStatus === filter.value
                      ? 'bg-gray-100 border-gray-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {filter.label}
                  <ChevronDown className="ml-2 h-3 w-3 inline" />
                </button>
              ))}
            </div>
          </div>

          {/* Domain Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            {domainTabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => setSelectedDomain(tab.value)}
                className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                  selectedDomain === tab.value
                    ? 'bg-gray-200 text-gray-900'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-sm text-gray-500">
            Showing {filteredChallenges.length} challenge{filteredChallenges.length !== 1 ? 's' : ''}
            {searchTerm && ` for "${searchTerm}"`}
          </p>
        </div>

        {/* Challenge Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredChallenges.map((challenge) => (
            <div 
              key={challenge.id} 
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:transform hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-pointer"
              onClick={() => handleJoinChallenge(challenge.id)}
            >
              {/* Featured Image */}
              <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <div className="text-white text-lg font-semibold">
                  {challenge.company_name || 'Challenge'}
                </div>
              </div>
              
              {/* Card Content */}
              <div className="p-5">
                {/* Company Label */}
                <div className="text-xs text-gray-500 font-medium mb-2">
                  by {challenge.company_name || 'Anonymous'}
                </div>
                
                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2" style={{ lineHeight: '1.4' }}>
                  {challenge.title}
                </h3>
                
                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-3" style={{ lineHeight: '1.6' }}>
                  {challenge.description}
                </p>

                {/* Prize and Status */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-medium text-gray-900">
                    {challenge.prize_amount ? `$${challenge.prize_amount.toLocaleString()}` : 'Prize TBD'}
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    challenge.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : challenge.status === 'judging'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
                  </div>
                </div>

                {/* Domains */}
                {challenge.domains && challenge.domains.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {challenge.domains.slice(0, 3).map((domain) => (
                      <span key={domain} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                        {domain}
                      </span>
                    ))}
                    {challenge.domains.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                        +{challenge.domains.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Join Button */}
                <button 
                  className="w-full h-9 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinChallenge(challenge.id);
                  }}
                >
                  Join Challenge
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredChallenges.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-base mb-4">No challenges found matching your criteria.</div>
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
      </div>
    </div>
  );
};

export default Challenges;
