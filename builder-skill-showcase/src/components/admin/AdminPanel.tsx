import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Users, Trophy, FileText, Home, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ChallengeManager } from "./ChallengeManager";
import { UserManager } from "./UserManager";
import { SubmissionManager } from "./SubmissionManager";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("challenges");
  const [stats, setStats] = useState({
    totalChallenges: 0,
    activeChallenges: 0,
    totalSubmissions: 0,
    totalUsers: 0,
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch challenges stats
      const { data: challenges } = await supabase
        .from('challenges')
        .select('status');

      // Fetch submissions count
      const { count: submissionsCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true });

      // Fetch users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalChallenges: challenges?.length || 0,
        activeChallenges: challenges?.filter(c => c.status === 'active').length || 0,
        totalSubmissions: submissionsCount || 0,
        totalUsers: usersCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="container mx-auto">
        {/* Navigation Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              className="text-gray-700 hover:text-gray-900"
              onClick={() => navigate("/")}
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button
              variant="ghost"
              className="text-gray-700 hover:text-gray-900"
              onClick={() => navigate("/challenges")}
            >
              Challenges
            </Button>
            <Button
              variant="ghost"
              className="text-gray-700 hover:text-gray-900"
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
            </Button>
          </div>

          <Button
            variant="outline"
            className="text-gray-700 border-gray-300 hover:bg-gray-50"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Manage challenges, users, and platform settings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Challenges</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalChallenges}</p>
                </div>
                <Trophy className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Challenges</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeChallenges}</p>
                </div>
                <Settings className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
                </div>
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Content with Sidebar */}
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 shrink-0">
            <Card className="bg-white border-gray-200">
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="w-full">
                  <TabsList className="flex flex-col h-auto w-full bg-transparent p-2 space-y-1">
                    <TabsTrigger 
                      value="challenges" 
                      className="w-full justify-start bg-transparent text-gray-700 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 hover:bg-gray-50 border border-transparent"
                    >
                      <Trophy className="h-4 w-4 mr-3" />
                      Challenge Management
                    </TabsTrigger>
                    <TabsTrigger 
                      value="submissions" 
                      className="w-full justify-start bg-transparent text-gray-700 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 hover:bg-gray-50 border border-transparent"
                    >
                      <FileText className="h-4 w-4 mr-3" />
                      Submission Management
                    </TabsTrigger>
                    <TabsTrigger 
                      value="users" 
                      className="w-full justify-start bg-transparent text-gray-700 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 hover:bg-gray-50 border border-transparent"
                    >
                      <Users className="h-4 w-4 mr-3" />
                      User Management
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsContent value="challenges" className="mt-0">
                <RoleGuard allowedRoles={['admin']} fallbackMessage="Only administrators can manage challenges.">
                  <ChallengeManager onStatsUpdate={fetchStats} />
                </RoleGuard>
              </TabsContent>

              <TabsContent value="submissions" className="mt-0">
                <RoleGuard allowedRoles={['admin']} fallbackMessage="Only administrators can manage submissions.">
                  <SubmissionManager />
                </RoleGuard>
              </TabsContent>

              <TabsContent value="users" className="mt-0">
                <RoleGuard allowedRoles={['admin']} fallbackMessage="Only administrators can manage users.">
                  <UserManager />
                </RoleGuard>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Badge Management */}
        <Card>
          <CardHeader>
            <CardTitle>Badge Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline"
              className="w-full"
              onClick={awardMissingFirstSubmissionBadges}
            >
              Award Missing "First Steps" Badges
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  async function awardMissingFirstSubmissionBadges() {
    try {
      // Get the "First Steps" badge
      const { data: firstStepsBadge, error: badgeError } = await supabase
        .from('badges')
        .select('id')
        .eq('badge_type', 'first_submission')
        .single();

      if (badgeError || !firstStepsBadge) {
        console.error('Could not find First Steps badge:', badgeError);
        return;
      }

      // Get all users who have submissions but don't have the First Steps badge
      const { data: usersWithSubmissions, error: submissionError } = await supabase
        .from('submissions')
        .select('participant_id')
        .not('participant_id', 'is', null);

      if (submissionError) {
        console.error('Error fetching submissions:', submissionError);
        return;
      }

      const uniqueUserIds = [...new Set(usersWithSubmissions?.map(s => s.participant_id) || [])];

      // Check which users already have the badge
      const { data: usersWithBadge, error: badgeCheckError } = await supabase
        .from('user_badges')
        .select('user_id')
        .eq('badge_id', firstStepsBadge.id);

      if (badgeCheckError) {
        console.error('Error checking existing badges:', badgeCheckError);
        return;
      }

      const usersWithBadgeIds = usersWithBadge?.map(ub => ub.user_id) || [];
      const usersMissingBadge = uniqueUserIds.filter(userId => !usersWithBadgeIds.includes(userId));

      // Award badges to users who don't have them
      if (usersMissingBadge.length > 0) {
        const badgeInserts = usersMissingBadge.map(userId => ({
          user_id: userId,
          badge_id: firstStepsBadge.id,
          earned_at: new Date().toISOString()
        }));

        const { error: insertError } = await supabase
          .from('user_badges')
          .insert(badgeInserts);

        if (insertError) {
          console.error('Error awarding badges:', insertError);
          return;
        }

        console.log(`Awarded First Steps badge to ${usersMissingBadge.length} users`);
      }

      console.log('Badge check complete');
    } catch (error) {
      console.error('Error in badge awarding process:', error);
    }
  }
};