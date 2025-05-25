
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, Github, User, ArrowRight, Edit, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  skills: string[] | null;
  experience_level: string | null;
  cv_url: string | null;
}

interface Submission {
  id: string;
  challenge_id: string;
  status: string;
  provisional_score: number | null;
  final_score: number | null;
  created_at: string;
  challenges: {
    title: string;
    company_name: string;
    submission_deadline: string;
  };
}

interface UserBadge {
  id: string;
  earned_at: string;
  badges: {
    name: string;
    description: string;
    badge_type: string;
  };
}

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<Partial<Profile>>({});
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      setProfile(profileData);
      setProfileForm(profileData || {});

      // Fetch submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          *,
          challenges (
            title,
            company_name,
            submission_deadline
          )
        `)
        .eq('participant_id', user.id)
        .order('created_at', { ascending: false });

      if (submissionsError) throw submissionsError;
      setSubmissions(submissionsData || []);

      // Fetch user badges
      const { data: badgesData, error: badgesError } = await supabase
        .from('user_badges')
        .select(`
          *,
          badges (
            name,
            description,
            badge_type
          )
        `)
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (badgesError) throw badgesError;
      setUserBadges(badgesData || []);

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profileForm,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setProfile({ ...profile, ...profileForm } as Profile);
      setEditingProfile(false);
      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "under_review":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "submitted":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "scored":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const calculateStats = () => {
    const completed = submissions.filter(s => s.final_score !== null).length;
    const totalEarnings = 0; // Would calculate from prize winnings
    const avgScore = submissions.length > 0 
      ? submissions.reduce((acc, s) => acc + (s.final_score || 0), 0) / submissions.length 
      : 0;

    return {
      challengesCompleted: completed,
      challengesSubmitted: submissions.length,
      totalEarnings,
      badges: userBadges.length,
      averageScore: avgScore.toFixed(1)
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <Header />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-white text-lg">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {profile?.full_name || user?.email || 'Anonymous User'}
                </h1>
                <p className="text-white/70">
                  {profile?.experience_level ? `${profile.experience_level.charAt(0).toUpperCase() + profile.experience_level.slice(1)} Builder` : 'AI Product Builder'}
                </p>
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-white/60">{stats.badges} badges earned</span>
                  {profile?.location && (
                    <>
                      <span className="text-white/60">•</span>
                      <span className="text-white/60">{profile.location}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">{stats.averageScore}</div>
              <div className="text-white/60">Average Score</div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white/10 border-white/20">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-white">{stats.challengesSubmitted}</div>
                <div className="text-white/60 text-sm">Challenges Submitted</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-white">{stats.challengesCompleted}</div>
                <div className="text-white/60 text-sm">Challenges Completed</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-white">${stats.totalEarnings}</div>
                <div className="text-white/60 text-sm">Total Earnings</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-white">{stats.badges}</div>
                <div className="text-white/60 text-sm">Badges Earned</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
            {[
              { id: "overview", label: "Overview" },
              { id: "submissions", label: "My Submissions" },
              { id: "achievements", label: "Achievements" },
              { id: "profile", label: "Profile" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md transition-all ${
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Submissions */}
            <div className="lg:col-span-2">
              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Recent Submissions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {submissions.slice(0, 3).map((submission) => (
                    <div key={submission.id} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-white font-semibold">{submission.challenges.title}</h4>
                          <p className="text-white/60 text-sm">by {submission.challenges.company_name}</p>
                        </div>
                        <Badge className={getStatusColor(submission.status)}>
                          {submission.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">
                          Submitted: {new Date(submission.created_at).toLocaleDateString()}
                        </span>
                        {submission.final_score && (
                          <span className="text-white">Score: {submission.final_score}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {submissions.length === 0 && (
                    <div className="text-center py-8 text-white/60">
                      No submissions yet. <Button 
                        variant="link" 
                        className="text-blue-400 p-0"
                        onClick={() => navigate("/challenges")}
                      >
                        Explore challenges
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Achievements */}
            <div>
              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Recent Achievements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userBadges.slice(0, 3).map((userBadge) => (
                    <div key={userBadge.id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                      <div className="text-2xl">🏆</div>
                      <div>
                        <div className="text-white font-medium">{userBadge.badges.name}</div>
                        <div className="text-white/60 text-sm">{userBadge.badges.description}</div>
                        <div className="text-white/50 text-xs">
                          {new Date(userBadge.earned_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {userBadges.length === 0 && (
                    <div className="text-center py-8 text-white/60">
                      No badges earned yet. Complete challenges to earn badges!
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "submissions" && (
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white">My Submissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {submissions.map((submission) => (
                <div key={submission.id} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-white font-semibold">{submission.challenges.title}</h4>
                      <p className="text-white/60 text-sm">by {submission.challenges.company_name}</p>
                    </div>
                    <Badge className={getStatusColor(submission.status)}>
                      {submission.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-white/60">
                    <div>Submitted: {new Date(submission.created_at).toLocaleDateString()}</div>
                    <div>Deadline: {new Date(submission.challenges.submission_deadline).toLocaleDateString()}</div>
                    {submission.provisional_score && (
                      <div>Provisional Score: {submission.provisional_score}</div>
                    )}
                    {submission.final_score && (
                      <div>Final Score: {submission.final_score}</div>
                    )}
                  </div>
                </div>
              ))}
              {submissions.length === 0 && (
                <div className="text-center py-12 text-white/60">
                  No submissions yet. <Button 
                    variant="link" 
                    className="text-blue-400 p-0"
                    onClick={() => navigate("/challenges")}
                  >
                    Browse challenges
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "achievements" && (
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Achievements & Badges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userBadges.map((userBadge) => (
                  <div key={userBadge.id} className="bg-white/5 rounded-lg p-4 text-center">
                    <div className="text-4xl mb-2">🏆</div>
                    <h4 className="text-white font-semibold">{userBadge.badges.name}</h4>
                    <p className="text-white/60 text-sm mb-2">{userBadge.badges.description}</p>
                    <Badge variant="outline" className="border-white/20 text-white/80">
                      {userBadge.badges.badge_type}
                    </Badge>
                    <div className="text-white/50 text-xs mt-2">
                      Earned {new Date(userBadge.earned_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
              {userBadges.length === 0 && (
                <div className="text-center py-12 text-white/60">
                  No badges earned yet. Complete challenges to unlock achievements!
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "profile" && (
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Profile Settings</CardTitle>
                {!editingProfile ? (
                  <Button 
                    onClick={() => setEditingProfile(true)}
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      onClick={updateProfile}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button 
                      onClick={() => {
                        setEditingProfile(false);
                        setProfileForm(profile || {});
                      }}
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {editingProfile ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">Full Name</label>
                      <Input
                        value={profileForm.full_name || ''}
                        onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">Username</label>
                      <Input
                        value={profileForm.username || ''}
                        onChange={(e) => setProfileForm({...profileForm, username: e.target.value})}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="Your username"
                      />
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">Location</label>
                      <Input
                        value={profileForm.location || ''}
                        onChange={(e) => setProfileForm({...profileForm, location: e.target.value})}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="City, Country"
                      />
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">Experience Level</label>
                      <select
                        value={profileForm.experience_level || ''}
                        onChange={(e) => setProfileForm({...profileForm, experience_level: e.target.value})}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                      >
                        <option value="" className="bg-slate-900">Select level</option>
                        <option value="beginner" className="bg-slate-900">Beginner</option>
                        <option value="intermediate" className="bg-slate-900">Intermediate</option>
                        <option value="advanced" className="bg-slate-900">Advanced</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">Bio</label>
                      <Textarea
                        value={profileForm.bio || ''}
                        onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                        className="bg-white/10 border-white/20 text-white min-h-[100px]"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">GitHub URL</label>
                      <Input
                        value={profileForm.github_url || ''}
                        onChange={(e) => setProfileForm({...profileForm, github_url: e.target.value})}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="https://github.com/username"
                      />
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">LinkedIn URL</label>
                      <Input
                        value={profileForm.linkedin_url || ''}
                        onChange={(e) => setProfileForm({...profileForm, linkedin_url: e.target.value})}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">Portfolio URL</label>
                      <Input
                        value={profileForm.portfolio_url || ''}
                        onChange={(e) => setProfileForm({...profileForm, portfolio_url: e.target.value})}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="https://yourportfolio.com"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-white font-medium">Full Name</h4>
                      <p className="text-white/70">{profile?.full_name || 'Not set'}</p>
                    </div>
                    <div>
                      <h4 className="text-white font-medium">Username</h4>
                      <p className="text-white/70">{profile?.username || 'Not set'}</p>
                    </div>
                    <div>
                      <h4 className="text-white font-medium">Location</h4>
                      <p className="text-white/70">{profile?.location || 'Not set'}</p>
                    </div>
                    <div>
                      <h4 className="text-white font-medium">Experience Level</h4>
                      <p className="text-white/70">{profile?.experience_level || 'Not set'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-white font-medium">Bio</h4>
                      <p className="text-white/70">{profile?.bio || 'No bio added yet'}</p>
                    </div>
                    <div>
                      <h4 className="text-white font-medium">Links</h4>
                      <div className="space-y-2">
                        {profile?.github_url && (
                          <a href={profile.github_url} target="_blank" rel="noopener noreferrer" 
                             className="text-blue-400 hover:text-blue-300 flex items-center">
                            <Github className="h-4 w-4 mr-2" />
                            GitHub
                          </a>
                        )}
                        {profile?.linkedin_url && (
                          <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" 
                             className="text-blue-400 hover:text-blue-300 flex items-center">
                            LinkedIn
                          </a>
                        )}
                        {profile?.portfolio_url && (
                          <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" 
                             className="text-blue-400 hover:text-blue-300 flex items-center">
                            Portfolio
                          </a>
                        )}
                        {!profile?.github_url && !profile?.linkedin_url && !profile?.portfolio_url && (
                          <p className="text-white/60">No links added yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
