
import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, Award, Star, User, Calendar, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LeaderboardEntry {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  total_score: number;
  total_submissions: number;
  challenge_wins: number;
  badge_count: number;
}

interface Challenge {
  id: string;
  title: string;
  company_name: string;
}

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchChallenges();
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedChallenge]);

  const fetchChallenges = async () => {
    try {
      console.log('=== LEADERBOARD CHALLENGES FETCH ===');
      
      // Get current user and role
      const { data: { user } } = await supabase.auth.getUser();
      let userRole = null;
      
      if (user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        userRole = roleData?.role;
      }
      
      console.log('User role in Leaderboard:', userRole);
      
      let query = supabase
        .from('challenges')
        .select('id, title, company_name');
      
      // Apply role-based filtering
      if (userRole === 'sponsor' || userRole === 'company') {
        // Sponsors should only see their own challenges
        query = query.eq('company_id', user.id);
        console.log('Filtering leaderboard challenges for sponsor/company:', user.id);
      }
      // Admins and other users can see all challenges
      
      const { data, error } = await query.order('title');

      if (error) throw error;
      setChallenges(data || []);
      console.log('Leaderboard challenges loaded:', data?.length || 0);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    }
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const challengeParam = selectedChallenge === "all" ? undefined : selectedChallenge;
      
      const { data, error } = await supabase.rpc('get_leaderboard', {
        challenge_id_param: challengeParam
      });

      if (error) throw error;
      setLeaderboardData(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast({
        title: "Error",
        description: "Failed to load leaderboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-2xl font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500";
      case 3:
        return "bg-gradient-to-r from-amber-400 to-amber-600";
      default:
        return "bg-gradient-to-r from-blue-400 to-blue-600";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-gray-700 text-lg">Loading leaderboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Trophy className="h-10 w-10 text-yellow-500" />
            Leaderboard
          </h1>
          <p className="text-gray-600 text-lg">
            See how you rank against other builders in the community
          </p>
        </div>

        {/* Filter Section */}
        <Card className="mb-8 bg-white border-gray-200">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <label className="text-sm font-medium text-gray-700">Filter by Challenge:</label>
                <Select value={selectedChallenge} onValueChange={setSelectedChallenge}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select a challenge" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Challenges</SelectItem>
                    {challenges.map((challenge) => (
                      <SelectItem key={challenge.id} value={challenge.id}>
                        {challenge.title} - {challenge.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={fetchLeaderboard} variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="h-6 w-6" />
              {selectedChallenge === "all" ? "Global Rankings" : "Challenge Rankings"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboardData.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 text-lg">No rankings available yet</p>
                <p className="text-gray-500 text-sm mt-2">
                  Be the first to submit a challenge solution!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {leaderboardData.map((entry, index) => {
                  const rank = index + 1;
                  const isTopThree = rank <= 3;
                  
                  return (
                    <div
                      key={entry.user_id}
                      className={`
                        flex items-center gap-4 p-6 rounded-lg border transition-all duration-200 hover:shadow-md
                        ${isTopThree 
                          ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 shadow-sm' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }
                      `}
                    >
                      {/* Rank */}
                      <div className="flex items-center justify-center w-16">
                        {getRankIcon(rank)}
                      </div>

                      {/* User Avatar */}
                      <div className={`
                        w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg
                        ${getRankBadgeColor(rank)}
                      `}>
                        {entry.avatar_url ? (
                          <img 
                            src={entry.avatar_url} 
                            alt={entry.full_name || entry.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-8 w-8" />
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {entry.full_name || entry.username || 'Anonymous User'}
                          </h3>
                          {entry.username && (
                            <span className="text-sm text-gray-600">@{entry.username}</span>
                          )}
                          {isTopThree && (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                              Top {rank}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            Score: {entry.total_score?.toFixed(1) || '0.0'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Submissions: {entry.total_submissions || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Trophy className="h-4 w-4" />
                            Wins: {entry.challenge_wins || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4" />
                            Badges: {entry.badge_count || 0}
                          </span>
                        </div>
                      </div>

                      {/* Score Display */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {entry.total_score?.toFixed(1) || '0.0'}
                        </div>
                        <div className="text-sm text-gray-500">points</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Footer */}
        {leaderboardData.length > 0 && (
          <Card className="mt-8 bg-white border-gray-200">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {leaderboardData.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Participants</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {leaderboardData.reduce((sum, entry) => sum + (entry.total_submissions || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Submissions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {leaderboardData.reduce((sum, entry) => sum + (entry.challenge_wins || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Wins</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {leaderboardData.reduce((sum, entry) => sum + (entry.badge_count || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Badges</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
