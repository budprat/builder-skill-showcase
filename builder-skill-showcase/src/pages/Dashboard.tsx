import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, User, Trophy, Upload, ExternalLink, Github, Play, FileText, Plus, Edit, Trash2, Settings, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { useToast } from "@/hooks/use-toast";
import { BadgeCollection } from "@/components/badges/BadgeCollection";
import { SponsorChallengeManager } from "@/components/admin/SponsorChallengeManager";
import { RoleGuard } from "@/components/auth/RoleGuard";
import EvaluatorSubmissionManager from "@/components/evaluator/EvaluatorSubmissionManager";
import ScoreDashboard from "@/components/evaluator/ScoreDashboard";

interface Challenge {
  id: string;
  title: string;
  description: string;
  company_name: string;
  domains: string[];
  prize_amount: number;
  submission_deadline: string;
  status: string;
}

interface Submission {
  id: string;
  challenge_id: string;
  challenge_title: string;
  repository_url: string;
  pitch_deck_url: string;
  demo_video_url: string;
  submitted_at: string;
  status: string;
  score?: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  badge_type: string;
  icon_url?: string;
}

interface UserBadge {
  id: string;
  badge_id: string;
  awarded_at: string;
  badges: Badge;
}

const Dashboard = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);

  console.log('=== DASHBOARD COMPONENT RENDERED ===');
  console.log('User:', user?.id);
  console.log('User Role:', userRole);
  console.log('Loading state:', loading);
  console.log('User email:', user?.email);
  console.log('Is evaluator?:', userRole === 'evaluator');
  
  // Redirect admin users to admin panel
  useEffect(() => {
    if (userRole === 'admin') {
      navigate('/admin');
      return;
    }
  }, [userRole, navigate]);

  const [submitting, setSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    company_name: "",
    domains: "",
    prize_amount: "",
    submission_deadline: "",
    challenge_type: "standard",
  });

  useEffect(() => {
    if (user) {
      fetchChallenges();
      fetchSubmissions();
      fetchUserBadges();
    }
  }, [user]);

  const fetchChallenges = async () => {
    try {
      console.log('=== DASHBOARD FETCH CHALLENGES ===');
      console.log('User role:', userRole);
      console.log('User ID:', user?.id);

      if (userRole === 'sponsor' && user) {
        console.log('Fetching challenges for sponsor:', user.id);
        
        // Fetch challenges created by the sponsor only
        const { data, error } = await supabase
          .from('challenges')
          .select('*')
          .eq('company_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        console.log('Raw sponsor challenges fetched:', data?.length || 0);
        
        // Additional client-side filtering to ensure only sponsor's challenges
        const sponsorChallenges = (data || []).filter(challenge => {
          const isOwned = challenge.company_id === user.id;
          if (!isOwned) {
            console.warn('Dashboard: Challenge does not belong to current sponsor:', {
              challengeId: challenge.id,
              challengeTitle: challenge.title,
              challengeCompanyId: challenge.company_id,
              currentUserId: user.id
            });
          }
          return isOwned;
        });
        
        console.log('Filtered sponsor challenges count:', sponsorChallenges.length);
        setChallenges(sponsorChallenges);
      } else {
        console.log('Fetching active challenges for non-sponsor user');
        // For other users, fetch active challenges
        const { data, error } = await supabase
          .from('challenges')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) throw error;
        console.log('Active challenges fetched:', data?.length || 0);
        setChallenges(data || []);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
    }
  };

  const fetchSubmissions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          challenges(title)
        `)
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      const formattedSubmissions = data?.map(submission => ({
        ...submission,
        challenge_title: submission.challenges?.title || 'Unknown Challenge'
      })) || [];

      setSubmissions(formattedSubmissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const fetchUserBadges = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          badges(*)
        `)
        .eq('user_id', user.id)
        .order('awarded_at', { ascending: false });

      if (error) throw error;
      setUserBadges(data || []);
    } catch (error) {
      console.error('Error fetching user badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('challenges')
        .insert([{
          title: formData.title,
          description: formData.description,
          company_name: formData.company_name,
          company_id: user.id,
          domains: formData.domains.split(',').map(d => d.trim()),
          prize_amount: parseInt(formData.prize_amount),
          submission_deadline: formData.submission_deadline,
          challenge_type: formData.challenge_type,
          status: 'active'
        }]);

      if (error) throw error;

      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        company_name: "",
        domains: "",
        prize_amount: "",
        submission_deadline: "",
        challenge_type: "standard",
      });
      fetchChallenges();

      toast({
        title: "Success",
        description: "Challenge created successfully",
      });
    } catch (error: any) {
      console.error('Error creating challenge:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create challenge",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrize = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-500';
      case 'under_review': return 'bg-yellow-500';
      case 'evaluated': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Manage your challenges, submissions, and track your progress</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {(userRole === 'participant' || !userRole) && (
              <>
                <TabsTrigger value="submissions">My Submissions</TabsTrigger>
                <TabsTrigger value="badges">Badges</TabsTrigger>
              </>
            )}
            {userRole === 'evaluator' && (
              <>
                {console.log('=== EVALUATOR TAB TRIGGER RENDERED ===')}
                {console.log('Current user role for evaluator tab:', userRole)}
                <TabsTrigger value="evaluator">Evaluate Submissions</TabsTrigger>
                <TabsTrigger value="score-dashboard">Score Analytics</TabsTrigger>
              </>
            )}
            {userRole === 'sponsor' && (
              <TabsTrigger value="sponsor">Manage Challenges</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Participant Dashboard */}
            {(userRole === 'participant' || !userRole) && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Challenges</CardTitle>
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{challenges.length}</div>
                      <p className="text-xs text-muted-foreground">Available to participate</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">My Submissions</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{submissions.length}</div>
                      <p className="text-xs text-muted-foreground">Total submissions made</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{userBadges.length}</div>
                      <p className="text-xs text-muted-foreground">Achievements unlocked</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Featured Challenges</CardTitle>
                      <CardDescription>Trending challenges with high prizes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {challenges.slice(0, 3).map((challenge) => (
                          <div key={challenge.id} className="flex items-center space-x-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{challenge.title}</p>
                              <p className="text-sm text-gray-500 truncate">{challenge.company_name}</p>
                              <p className="text-xs text-green-600 font-medium">Prize: {formatPrize(challenge.prize_amount)}</p>
                            </div>
                            <Button size="sm" onClick={() => window.open(`/challenges/${challenge.id}`, '_self')}>
                              View
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>My Progress</CardTitle>
                      <CardDescription>Your recent submissions and performance</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {submissions.slice(0, 3).map((submission) => (
                          <div key={submission.id} className="flex items-center space-x-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{submission.challenge_title}</p>
                              <p className="text-xs text-gray-400">
                                Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                              </p>
                              {submission.score && (
                                <p className="text-xs text-green-600">Score: {submission.score}/100</p>
                              )}
                            </div>
                            <Badge className={getStatusColor(submission.status)}>
                              {submission.status}
                            </Badge>
                          </div>
                        ))}
                        {submissions.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">
                            No submissions yet. Start your journey by participating in a challenge!
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {/* Sponsor Dashboard */}
            {userRole === 'sponsor' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">My Challenges</CardTitle>
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{challenges.length}</div>
                      <p className="text-xs text-muted-foreground">Challenges created</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">Across all challenges</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Participants</CardTitle>
                      <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">Currently participating</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Prize Pool</CardTitle>
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">$0</div>
                      <p className="text-xs text-muted-foreground">Across all challenges</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Your Challenges</CardTitle>
                        <CardDescription>Overview of challenges you've created</CardDescription>
                      </div>
                      <Button 
                        onClick={() => {
                          const sponsorTab = document.querySelector('[value="sponsor"]') as HTMLElement;
                          sponsorTab?.click();
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Challenge
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {challenges.length === 0 ? (
                          <div className="text-center py-12 text-gray-500">
                            <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg">No challenges created yet</p>
                            <p className="text-sm mt-2">Create your first challenge to start receiving submissions</p>
                          </div>
                        ) : (
                          challenges.slice(0, 5).map((challenge) => (
                            <div key={challenge.id} className="border rounded-lg p-4 hover:bg-gray-50">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-gray-900">{challenge.title}</h3>
                                    <Badge className={`${
                                      challenge.status === 'active' ? 'bg-green-100 text-green-800' :
                                      challenge.status === 'completed' ? 'bg-red-100 text-red-800' :
                                      challenge.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                      challenge.status === 'judging' ? 'bg-blue-100 text-blue-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {challenge.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{challenge.description}</p>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <Trophy className="h-3 w-3" />
                                      {formatPrize(challenge.prize_amount)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(challenge.submission_deadline).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      0 submissions
                                    </span>
                                  </div>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => window.open(`/challenges/${challenge.id}`, '_self')}
                                >
                                  View
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                        {challenges.length > 5 && (
                          <div className="text-center pt-4">
                            <Button 
                              variant="outline"
                              onClick={() => {
                                const sponsorTab = document.querySelector('[value="sponsor"]') as HTMLElement;
                                sponsorTab?.click();
                              }}
                            >
                              View All Challenges ({challenges.length})
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {/* Evaluator Dashboard */}
            {userRole === 'evaluator' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                      <FileText className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">0</div>
                      <p className="text-xs text-muted-foreground">Awaiting evaluation</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Completed Reviews</CardTitle>
                      <Trophy className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">0</div>
                      <p className="text-xs text-muted-foreground">Total evaluated</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Challenges</CardTitle>
                      <Calendar className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{challenges.length}</div>
                      <p className="text-xs text-muted-foreground">Available for evaluation</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg. Score Given</CardTitle>
                      <Trophy className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">--</div>
                      <p className="text-xs text-muted-foreground">Out of 100</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Evaluation Queue</CardTitle>
                        <CardDescription>Submissions waiting for your review</CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const evaluatorTab = document.querySelector('[value="evaluator"]') as HTMLElement;
                          evaluatorTab?.click();
                        }}
                      >
                        View All
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-sm">No submissions pending review</p>
                          <p className="text-xs">Check back later for new submissions to evaluate</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Evaluation Guidelines</CardTitle>
                      <CardDescription>Key criteria for assessment</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm font-medium">Technical Implementation</p>
                            <p className="text-xs text-gray-500">Code quality, architecture, and functionality</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm font-medium">Innovation & Creativity</p>
                            <p className="text-xs text-gray-500">Unique approach and creative solutions</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm font-medium">Problem Solving</p>
                            <p className="text-xs text-gray-500">How well the solution addresses the challenge</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm font-medium">Presentation</p>
                            <p className="text-xs text-gray-500">Demo quality and documentation</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            
          </TabsContent>

          <TabsContent value="submissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Submissions</CardTitle>
                <CardDescription>Track all your challenge submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{submission.challenge_title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            {submission.repository_url && (
                              <a
                                href={submission.repository_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                              >
                                <Github className="h-4 w-4" />
                                Repository
                              </a>
                            )}
                            {submission.demo_video_url && (
                              <a
                                href={submission.demo_video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                              >
                                <Play className="h-4 w-4" />
                                Demo
                              </a>
                            )}
                            {submission.pitch_deck_url && (
                              <a
                                href={submission.pitch_deck_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                              >
                                <FileText className="h-4 w-4" />
                                Pitch Deck
                              </a>
                            )}
                          </div>
                          {submission.score && (
                            <p className="text-sm text-green-600 mt-2">Score: {submission.score}/100</p>
                          )}
                        </div>
                        <Badge className={getStatusColor(submission.status)}>
                          {submission.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {submissions.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      No submissions yet. Start by participating in a challenge!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="badges" className="space-y-6">
            {user && (
              <BadgeCollection userId={user.id} showTitle={false} compact={false} />
            )}
          </TabsContent>

          {userRole === 'evaluator' && (
            <>
              <TabsContent value="evaluator" className="space-y-6">
                {console.log('=== EVALUATOR TAB CONTENT RENDERED ===')}
                {console.log('User role for evaluator tab:', userRole)}
                <RoleGuard 
                  allowedRoles={['evaluator']} 
                  fallbackMessage="Only evaluators can evaluate submissions."
                >
                  {console.log('=== INSIDE ROLE GUARD FOR EVALUATOR ===')}
                  <EvaluatorSubmissionManager />
                </RoleGuard>
              </TabsContent>
              
              <TabsContent value="score-dashboard" className="space-y-6">
                <RoleGuard 
                  allowedRoles={['evaluator']} 
                  fallbackMessage="Only evaluators can view score analytics."
                >
                  <ScoreDashboard />
                </RoleGuard>
              </TabsContent>
            </>
          )}

          {userRole === 'sponsor' && (
            <TabsContent value="sponsor" className="space-y-6">
              <RoleGuard 
                allowedRoles={['sponsor']} 
                fallbackMessage="Only sponsors can manage challenges."
              >
                <SponsorChallengeManager />
              </RoleGuard>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;