import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Calendar, DollarSign, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Challenge {
  id: string;
  title: string;
  description: string;
  prize_amount: number;
  prize_description: string;
  submission_deadline: string;
  status: string;
  company_name: string;
  domains: string[];
  created_at: string;
}

const Challenges = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      console.log("=== FETCHING CHALLENGES ===");
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching challenges:", error);
        return;
      }

      setChallenges(data || []);
      console.log("Fetched challenges count:", data?.length || 0);
      console.log("Challenge IDs:", data?.map(c => c.id) || []);
    } catch (error) {
      console.error("Error fetching challenges:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      formatted: date.toLocaleDateString(),
      daysLeft: diffDays > 0 ? diffDays : 0,
      isExpired: diffDays <= 0
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "judging":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredChallenges = challenges.filter((challenge) => {
    const matchesSearch = challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         challenge.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         challenge.domains?.some(domain => domain.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDomain = domainFilter === "all" || challenge.domains?.includes(domainFilter);
    const matchesStatus = statusFilter === "all" || challenge.status === statusFilter;

    return matchesSearch && matchesDomain && matchesStatus;
  });

  const allDomains = Array.from(new Set(challenges.flatMap(c => c.domains || [])));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading challenges...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Building Challenges</h1>
          <p className="text-xl text-gray-600 mb-6">
            Showcase your AI product development skills and compete for prizes
          </p>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search challenges, companies, or technologies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={domainFilter} onValueChange={setDomainFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Domains" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Domains</SelectItem>
                {allDomains.map((domain) => (
                  <SelectItem key={domain} value={domain}>
                    {domain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="judging">Judging</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm text-gray-500">
            Showing {filteredChallenges.length} challenge{filteredChallenges.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Challenge Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredChallenges.map((challenge) => {
            const deadline = formatDeadline(challenge.submission_deadline);

            return (
              <Card key={challenge.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge className={getStatusColor(challenge.status)}>
                      {challenge.status}
                    </Badge>
                    <div className="text-right">
                      <div className="flex items-center text-green-600 font-semibold">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {challenge.prize_amount?.toLocaleString() || "0"}
                      </div>
                      {challenge.prize_description && (
                        <div className="text-sm text-gray-500">
                          {challenge.prize_description}
                        </div>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-xl mb-2">{challenge.title}</CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                    by {challenge.company_name || "Anonymous"}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <p className="text-gray-700 mb-4 line-clamp-3">
                    {challenge.description}
                  </p>

                  {/* Domains */}
                  {challenge.domains && challenge.domains.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {challenge.domains.map((domain, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {domain}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Deadline Info */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Due: {deadline.formatted}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {deadline.isExpired ? "Expired" : `${deadline.daysLeft} days left`}
                    </div>
                  </div>

                  <Button 
                    className="w-full"
                    onClick={() => navigate(`/challenges/${challenge.id}`)}
                    disabled={deadline.isExpired}
                  >
                    {deadline.isExpired ? "Challenge Expired" : "View Challenge"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredChallenges.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No challenges found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Challenges;