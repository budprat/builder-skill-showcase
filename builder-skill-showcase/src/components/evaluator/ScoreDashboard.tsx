
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Users, Award, FileText, Download, Filter, Search, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Score = Tables<"scores">;
type Submission = Tables<"submissions">;
type Challenge = Tables<"challenges">;
type Profile = Tables<"profiles">;

interface ScoreWithDetails extends Score {
  submissions?: Submission & {
    challenges?: Challenge;
    profiles?: Profile;
  };
}

interface ScoreAnalytics {
  totalScores: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  scoringTrend: Array<{ period: string; avgScore: number; count: number }>;
  categoryBreakdown: Array<{ category: string; avgScore: number; count: number }>;
  submissionsByChallenge: Array<{ challenge: string; submissions: number; avgScore: number }>;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

const ScoreDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [scores, setScores] = useState<ScoreWithDetails[]>([]);
  const [analytics, setAnalytics] = useState<ScoreAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("all");
  const [selectedChallenge, setSelectedChallenge] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<string>("desc");

  useEffect(() => {
    if (user) {
      fetchScores();
    }
  }, [user, selectedTimeRange, selectedChallenge]);

  const fetchScores = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('scores')
        .select(`
          *,
          submissions (
            *,
            challenges (
              id,
              title,
              company_name,
              domains
            ),
            profiles (
              id,
              full_name,
              username
            )
          )
        `)
        .eq('evaluator_id', user.id)
        .order('created_at', { ascending: false });

      // Apply time range filter
      if (selectedTimeRange !== "all") {
        const now = new Date();
        let startDate = new Date();
        
        switch (selectedTimeRange) {
          case "week":
            startDate.setDate(now.getDate() - 7);
            break;
          case "month":
            startDate.setMonth(now.getMonth() - 1);
            break;
          case "quarter":
            startDate.setMonth(now.getMonth() - 3);
            break;
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data || [];

      // Apply challenge filter
      if (selectedChallenge !== "all") {
        filteredData = filteredData.filter(score => 
          score.submissions?.challenge_id === selectedChallenge
        );
      }

      // Apply search filter
      if (searchTerm) {
        filteredData = filteredData.filter(score => 
          score.submissions?.challenges?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          score.submissions?.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          score.submissions?.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Apply sorting
      filteredData.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortBy) {
          case "score":
            aValue = a.total_score || 0;
            bValue = b.total_score || 0;
            break;
          case "participant":
            aValue = a.submissions?.profiles?.full_name || a.submissions?.profiles?.username || "";
            bValue = b.submissions?.profiles?.full_name || b.submissions?.profiles?.username || "";
            break;
          case "challenge":
            aValue = a.submissions?.challenges?.title || "";
            bValue = b.submissions?.challenges?.title || "";
            break;
          default: // date
            aValue = new Date(a.created_at);
            bValue = new Date(b.created_at);
        }

        if (sortOrder === "asc") {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      setScores(filteredData);
      calculateAnalytics(filteredData);
    } catch (error) {
      console.error('Error fetching scores:', error);
      toast({
        title: "Error",
        description: "Failed to fetch scores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (scoresData: ScoreWithDetails[]) => {
    if (scoresData.length === 0) {
      setAnalytics(null);
      return;
    }

    const totalScores = scoresData.length;
    const scoreValues = scoresData.map(s => s.total_score || 0);
    const averageScore = scoreValues.reduce((a, b) => a + b, 0) / totalScores;
    const highestScore = Math.max(...scoreValues);
    const lowestScore = Math.min(...scoreValues);

    // Group by week for trending
    const scoresByWeek = scoresData.reduce((acc, score) => {
      const week = new Date(score.created_at).toISOString().split('T')[0];
      if (!acc[week]) {
        acc[week] = { scores: [], count: 0 };
      }
      acc[week].scores.push(score.total_score || 0);
      acc[week].count++;
      return acc;
    }, {} as Record<string, { scores: number[], count: number }>);

    const scoringTrend = Object.entries(scoresByWeek).map(([period, data]) => ({
      period,
      avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
      count: data.count
    })).sort((a, b) => a.period.localeCompare(b.period));

    // Category breakdown
    const categoryBreakdown = [
      {
        category: "Technical Implementation",
        avgScore: scoresData.reduce((sum, s) => sum + (s.technical_implementation || 0), 0) / totalScores,
        count: totalScores
      },
      {
        category: "Innovation",
        avgScore: scoresData.reduce((sum, s) => sum + (s.innovation || 0), 0) / totalScores,
        count: totalScores
      },
      {
        category: "Presentation",
        avgScore: scoresData.reduce((sum, s) => sum + (s.presentation || 0), 0) / totalScores,
        count: totalScores
      },
      {
        category: "Practicality",
        avgScore: scoresData.reduce((sum, s) => sum + (s.practicality || 0), 0) / totalScores,
        count: totalScores
      }
    ];

    // Submissions by challenge
    const challengeGroups = scoresData.reduce((acc, score) => {
      const challengeTitle = score.submissions?.challenges?.title || 'Unknown Challenge';
      if (!acc[challengeTitle]) {
        acc[challengeTitle] = { scores: [], count: 0 };
      }
      acc[challengeTitle].scores.push(score.total_score || 0);
      acc[challengeTitle].count++;
      return acc;
    }, {} as Record<string, { scores: number[], count: number }>);

    const submissionsByChallenge = Object.entries(challengeGroups).map(([challenge, data]) => ({
      challenge,
      submissions: data.count,
      avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length
    }));

    setAnalytics({
      totalScores,
      averageScore,
      highestScore,
      lowestScore,
      scoringTrend,
      categoryBreakdown,
      submissionsByChallenge
    });
  };

  const exportData = () => {
    const csvData = scores.map(score => ({
      'Submission ID': score.submission_id,
      'Participant': score.submissions?.profiles?.full_name || score.submissions?.profiles?.username,
      'Challenge': score.submissions?.challenges?.title,
      'Total Score': score.total_score,
      'Technical': score.technical_implementation,
      'Innovation': score.innovation,
      'Presentation': score.presentation,
      'Practicality': score.practicality,
      'Date': new Date(score.created_at).toLocaleDateString(),
      'Feedback': score.feedback
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluation-scores-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-gray-600">Loading score analytics...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-900 text-2xl flex items-center gap-2">
                <Award className="h-6 w-6" />
                Enhanced Score Dashboard
              </CardTitle>
              <CardDescription>
                Comprehensive analytics and insights for your evaluations
              </CardDescription>
            </div>
            <Button onClick={exportData} variant="outline" className="border-gray-300">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search by participant or challenge..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Time Range</label>
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="score">Score</SelectItem>
                  <SelectItem value="participant">Participant</SelectItem>
                  <SelectItem value="challenge">Challenge</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Order</label>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Desc</SelectItem>
                  <SelectItem value="asc">Asc</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={fetchScores} variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Evaluations</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalScores}</div>
              <p className="text-xs text-muted-foreground">Submissions evaluated</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.averageScore.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Out of 100</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
              <Award className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{analytics.highestScore}</div>
              <p className="text-xs text-muted-foreground">Best performance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lowest Score</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{analytics.lowestScore}</div>
              <p className="text-xs text-muted-foreground">Needs improvement</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts and Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Score Categories</TabsTrigger>
          <TabsTrigger value="challenges">By Challenge</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Scores</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Scoring Trend</CardTitle>
                  <CardDescription>Average scores over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.scoringTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="avgScore" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Challenge Distribution</CardTitle>
                  <CardDescription>Submissions by challenge</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.submissionsByChallenge}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="submissions"
                        label={({ challenge, submissions }) => `${challenge.substring(0, 15)}... (${submissions})`}
                      >
                        {analytics.submissionsByChallenge.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          {analytics && (
            <Card>
              <CardHeader>
                <CardTitle>Score Categories Breakdown</CardTitle>
                <CardDescription>Average scores across evaluation criteria</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.categoryBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis domain={[0, 25]} />
                    <Tooltip />
                    <Bar dataKey="avgScore" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="challenges" className="space-y-6">
          {analytics && (
            <Card>
              <CardHeader>
                <CardTitle>Performance by Challenge</CardTitle>
                <CardDescription>Average scores and submission counts per challenge</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.submissionsByChallenge.map((challenge, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{challenge.challenge}</h3>
                        <p className="text-sm text-gray-500">{challenge.submissions} submissions</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-purple-600">
                          {challenge.avgScore.toFixed(1)}/100
                        </div>
                        <div className="text-xs text-gray-500">Average Score</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Score List</CardTitle>
              <CardDescription>All your evaluations with complete breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scores.map((score) => (
                  <div key={score.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {score.submissions?.challenges?.title || 'Unknown Challenge'}
                        </h3>
                        <p className="text-gray-600">
                          <strong>Participant:</strong> {score.submissions?.profiles?.full_name || score.submissions?.profiles?.username || 'Unknown'}
                        </p>
                        <p className="text-gray-600">
                          <strong>Evaluated:</strong> {new Date(score.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-600">
                          {score.total_score}/100
                        </div>
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                          Total Score
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded">
                        <div className="text-lg font-bold text-blue-600">
                          {score.technical_implementation || 0}/25
                        </div>
                        <div className="text-xs text-blue-700">Technical</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded">
                        <div className="text-lg font-bold text-green-600">
                          {score.innovation || 0}/25
                        </div>
                        <div className="text-xs text-green-700">Innovation</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded">
                        <div className="text-lg font-bold text-yellow-600">
                          {score.presentation || 0}/25
                        </div>
                        <div className="text-xs text-yellow-700">Presentation</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded">
                        <div className="text-lg font-bold text-orange-600">
                          {score.practicality || 0}/25
                        </div>
                        <div className="text-xs text-orange-700">Practicality</div>
                      </div>
                    </div>

                    {score.feedback && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <strong className="text-gray-900">Feedback:</strong>
                        <p className="text-gray-700 mt-1">{score.feedback}</p>
                      </div>
                    )}
                  </div>
                ))}

                {scores.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 text-lg">No scores found</p>
                    <p className="text-gray-500 text-sm mt-2">
                      {searchTerm || selectedTimeRange !== "all" || selectedChallenge !== "all" 
                        ? "Try adjusting your filters" 
                        : "Start evaluating submissions to see your scoring analytics"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScoreDashboard;
