
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, FileText, Trophy, Upload, Trash2, Edit, Eye, Settings, MapPin, Github, Linkedin, Globe, Mail, Plus, Gavel } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/files/FileUpload";
import { BadgeCollection } from "@/components/badges/BadgeCollection";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Submission = Tables<"submissions">;

const Dashboard = () => {
  const { user, loading, userRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [updating, setUpdating] = useState(false);
  const [deletingSubmissionId, setDeletingSubmissionId] = useState<string | null>(null);
  const [editingSubmissionId, setEditingSubmissionId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    repository_url: "",
    pitch_deck_url: "",
    demo_video_url: "",
    readme_notes: "",
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [profileData, setProfileData] = useState({
    full_name: "",
    username: "",
    bio: "",
    location: "",
    github_url: "",
    linkedin_url: "",
    portfolio_url: "",
    experience_level: "",
    skills: [] as string[],
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSubmissions();
      if (userRole === 'sponsor') {
        fetchChallenges();
      }
    }
  }, [user, userRole]);

  const fetchChallenges = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('company_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;

    try {
      console.log('Fetching profile for user:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('Profile fetch response:', { data, error });

      if (error && error.code !== 'PGRST116') {
        console.error('Profile fetch error:', error);
        throw error;
      }

      if (data) {
        console.log('Profile data found:', data);
        setProfile(data);
        setProfileData({
          full_name: data.full_name || "",
          username: data.username || "",
          bio: data.bio || "",
          location: data.location || "",
          github_url: data.github_url || "",
          linkedin_url: data.linkedin_url || "",
          portfolio_url: data.portfolio_url || "",
          experience_level: data.experience_level || "",
          skills: data.skills || [],
        });
      } else {
        console.log('No profile data found, will create new profile on update');
        setProfile(null);
        setProfileData({
          full_name: "",
          username: "",
          bio: "",
          location: "",
          github_url: "",
          linkedin_url: "",
          portfolio_url: "",
          experience_level: "",
          skills: [],
        });
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Warning",
        description: "Could not load profile data. You can still update your profile.",
        variant: "destructive",
      });
    }
  };

  const fetchSubmissions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          challenges (title, company_name),
          scores (total_score, pre_screening_score, llm_scores, feedback, status)
        `)
        .eq('participant_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const updateProfile = async () => {
    if (!user) return;

    setUpdating(true);
    try {
      console.log('Updating profile for user:', user.id);
      console.log('Profile data:', profileData);

      const cleanProfileData = {
        id: user.id,
        full_name: profileData.full_name || null,
        username: profileData.username || null,
        bio: profileData.bio || null,
        location: profileData.location || null,
        github_url: profileData.github_url || null,
        linkedin_url: profileData.linkedin_url || null,
        portfolio_url: profileData.portfolio_url || null,
        experience_level: profileData.experience_level || null,
        skills: profileData.skills || [],
        updated_at: new Date().toISOString(),
      };

      console.log('Clean profile data:', cleanProfileData);

      const { data, error } = await supabase
        .from('profiles')
        .upsert(cleanProfileData, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Profile update error:', error);
        throw error;
      }

      console.log('Profile update response:', data);

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      fetchProfile();
    } catch (error: any) {
      console.error('Profile update failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleFileUploaded = (fileData: any) => {
    toast({
      title: "File uploaded",
      description: `${fileData.file_name} has been uploaded successfully`,
    });
  };

  const deleteSubmission = async (submissionId: string) => {
    if (!user) return;

    const confirmed = window.confirm("Are you sure you want to delete this submission? This action cannot be undone.");
    if (!confirmed) return;

    setDeletingSubmissionId(submissionId);
    try {
      console.log('Attempting to delete submission:', submissionId);
      console.log('User ID:', user.id);

      const { data: submissionCheck, error: checkError } = await supabase
        .from('submissions')
        .select('id, participant_id')
        .eq('id', submissionId)
        .single();

      if (checkError) {
        console.error('Error checking submission:', checkError);
        throw new Error('Submission not found or access denied');
      }

      if (submissionCheck.participant_id !== user.id) {
        throw new Error('You can only delete your own submissions');
      }

      const { error: scoresError } = await supabase
        .from('scores')
        .delete()
        .eq('submission_id', submissionId);

      if (scoresError) {
        console.warn('Error deleting related scores:', scoresError);
      }

      const { error: deleteError } = await supabase
        .from('submissions')
        .delete()
        .eq('id', submissionId)
        .eq('participant_id', user.id);

      if (deleteError) {
        console.error('Error deleting submission:', deleteError);
        throw deleteError;
      }

      console.log('Submission deleted successfully');

      toast({
        title: "Success",
        description: "Submission deleted successfully",
      });

      await fetchSubmissions();
    } catch (error: any) {
      console.error('Delete submission error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete submission",
        variant: "destructive",
      });
    } finally {
      setDeletingSubmissionId(null);
    }
  };

  const openEditDialog = (submission: Submission) => {
    setEditingSubmissionId(submission.id);
    setEditFormData({
      repository_url: submission.repository_url || "",
      pitch_deck_url: submission.pitch_deck_url || "",
      demo_video_url: submission.demo_video_url || "",
      readme_notes: submission.readme_notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const updateSubmission = async () => {
    if (!user || !editingSubmissionId) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          repository_url: editFormData.repository_url,
          pitch_deck_url: editFormData.pitch_deck_url,
          demo_video_url: editFormData.demo_video_url,
          readme_notes: editFormData.readme_notes,
          status: 'submitted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingSubmissionId)
        .eq('participant_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Submission updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingSubmissionId(null);
      await fetchSubmissions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update submission",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-700">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Please sign in to view your dashboard</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs defaultValue="profile" className="space-y-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:w-64 shrink-0">
              <Card className="bg-white border-gray-200">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {profileData.full_name || "User"}
                    </h2>
                    <p className="text-gray-600">
                      @{profileData.username || "username"}
                    </p>
                  </div>
                  
                  <TabsList className="flex flex-col h-auto w-full bg-gray-100 p-1 space-y-1">
                    <TabsTrigger 
                      value="profile" 
                      className="w-full justify-start bg-transparent text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 hover:bg-gray-50"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </TabsTrigger>
                    <TabsTrigger 
                      value="edit-profile" 
                      className="w-full justify-start bg-transparent text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 hover:bg-gray-50"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Profile
                    </TabsTrigger>
                    <TabsTrigger 
                      value="submissions" 
                      className="w-full justify-start bg-transparent text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 hover:bg-gray-50"
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      Submissions ({submissions.length})
                    </TabsTrigger>
                    <TabsTrigger 
                      value="badges" 
                      className="w-full justify-start bg-transparent text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 hover:bg-gray-50"
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      Badges
                    </TabsTrigger>
                    <TabsTrigger 
                      value="files" 
                      className="w-full justify-start bg-transparent text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 hover:bg-gray-50"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Documents
                    </TabsTrigger>
                    {userRole === 'sponsor' && (
                      <TabsTrigger 
                        value="my-challenges" 
                        className="w-full justify-start bg-transparent text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 hover:bg-gray-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        My Challenges ({challenges.length})
                      </TabsTrigger>
                    )}
                    {userRole === 'evaluator' && (
                      <TabsTrigger 
                        value="evaluate" 
                        className="w-full justify-start bg-transparent text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 hover:bg-gray-50"
                      >
                        <Gavel className="h-4 w-4 mr-2" />
                        Evaluate Submissions
                      </TabsTrigger>
                    )}
                  </TabsList>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <TabsContent value="profile" className="mt-0">
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900 text-2xl">Profile Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-gray-600 text-sm font-medium">Full Name</Label>
                          <p className="text-gray-900 text-lg font-medium mt-1">
                            {profileData.full_name || "Not provided"}
                          </p>
                        </div>
                        
                        <div>
                          <Label className="text-gray-600 text-sm font-medium">Username</Label>
                          <p className="text-gray-900 text-lg font-medium mt-1">
                            @{profileData.username || "username"}
                          </p>
                        </div>

                        <div>
                          <Label className="text-gray-600 text-sm font-medium">Experience Level</Label>
                          <div className="mt-1">
                            <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-800">
                              {profileData.experience_level ? 
                                profileData.experience_level.charAt(0).toUpperCase() + profileData.experience_level.slice(1) 
                                : "Not specified"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-gray-600 text-sm font-medium flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Location
                          </Label>
                          <p className="text-gray-900 text-lg font-medium mt-1">
                            {profileData.location || "Not provided"}
                          </p>
                        </div>

                        <div>
                          <Label className="text-gray-600 text-sm font-medium flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                          </Label>
                          <p className="text-gray-900 text-lg font-medium mt-1">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <Label className="text-gray-600 text-sm font-medium">Bio</Label>
                      <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-gray-900 leading-relaxed">
                          {profileData.bio || "No bio provided"}
                        </p>
                      </div>
                    </div>

                    {/* Links */}
                    <div>
                      <Label className="text-gray-600 text-sm font-medium">Links</Label>
                      <div className="mt-3 grid grid-cols-1 gap-3">
                        {profileData.github_url && (
                          <a 
                            href={profileData.github_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                          >
                            <Github className="h-5 w-5 text-gray-700" />
                            <span className="text-gray-900">GitHub Profile</span>
                          </a>
                        )}
                        {profileData.linkedin_url && (
                          <a 
                            href={profileData.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                          >
                            <Linkedin className="h-5 w-5 text-gray-700" />
                            <span className="text-gray-900">LinkedIn Profile</span>
                          </a>
                        )}
                        {profileData.portfolio_url && (
                          <a 
                            href={profileData.portfolio_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                          >
                            <Globe className="h-5 w-5 text-gray-700" />
                            <span className="text-gray-900">Portfolio Website</span>
                          </a>
                        )}
                        {!profileData.github_url && !profileData.linkedin_url && !profileData.portfolio_url && (
                          <p className="text-gray-500 italic">No links provided</p>
                        )}
                      </div>
                    </div>

                    {/* Skills */}
                    {profileData.skills && profileData.skills.length > 0 && (
                      <div>
                        <Label className="text-gray-600 text-sm font-medium">Skills</Label>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {profileData.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Badges */}
                    <div>
                      <BadgeCollection userId={user.id} showTitle={true} compact={true} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="edit-profile" className="mt-0">
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900 text-2xl flex items-center gap-2">
                      <Edit className="h-6 w-6" />
                      Edit Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="full_name" className="text-gray-900">Full Name</Label>
                        <Input
                          id="full_name"
                          value={profileData.full_name}
                          onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                          className="mt-1 border-gray-300 text-gray-900"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="username" className="text-gray-900">Username</Label>
                        <Input
                          id="username"
                          value={profileData.username}
                          onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                          className="mt-1 border-gray-300 text-gray-900"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="bio" className="text-gray-900">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                        rows={4}
                        className="mt-1 border-gray-300 text-gray-900"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="location" className="text-gray-900">Location</Label>
                        <Input
                          id="location"
                          value={profileData.location}
                          onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                          className="mt-1 border-gray-300 text-gray-900"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="experience_level" className="text-gray-900">Experience Level</Label>
                        <select
                          id="experience_level"
                          value={profileData.experience_level}
                          onChange={(e) => setProfileData({...profileData, experience_level: e.target.value})}
                          className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select experience level</option>
                          <option value="beginner">Beginner</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="github_url" className="text-gray-900">GitHub URL</Label>
                        <Input
                          id="github_url"
                          value={profileData.github_url}
                          onChange={(e) => setProfileData({...profileData, github_url: e.target.value})}
                          placeholder="https://github.com/yourusername"
                          className="mt-1 border-gray-300 text-gray-900"
                        />
                      </div>

                      <div>
                        <Label htmlFor="linkedin_url" className="text-gray-900">LinkedIn URL</Label>
                        <Input
                          id="linkedin_url"
                          value={profileData.linkedin_url}
                          onChange={(e) => setProfileData({...profileData, linkedin_url: e.target.value})}
                          placeholder="https://linkedin.com/in/yourusername"
                          className="mt-1 border-gray-300 text-gray-900"
                        />
                      </div>

                      <div>
                        <Label htmlFor="portfolio_url" className="text-gray-900">Portfolio URL</Label>
                        <Input
                          id="portfolio_url"
                          value={profileData.portfolio_url}
                          onChange={(e) => setProfileData({...profileData, portfolio_url: e.target.value})}
                          placeholder="https://yourportfolio.com"
                          className="mt-1 border-gray-300 text-gray-900"
                        />
                      </div>
                    </div>

                    <Button 
                      onClick={updateProfile} 
                      disabled={updating}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {updating ? "Updating..." : "Update Profile"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="submissions" className="mt-0">
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900 text-2xl flex items-center gap-2">
                      <Trophy className="h-6 w-6" />
                      My Submissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {submissions.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 text-lg">No submissions yet</p>
                        <p className="text-gray-500 text-sm mt-2">Start by participating in challenges!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {submissions.map((submission: any) => (
                          <div key={submission.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-lg">{submission.challenges?.title}</h3>
                                <p className="text-gray-600 mt-1">
                                  Company: {submission.challenges?.company_name || 'N/A'}
                                </p>
                                <div className="flex items-center gap-2 mt-3">
                                  <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-800">
                                    {submission.status}
                                  </Badge>
                                  {submission.scores && submission.scores.length > 0 && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                                      AI Score: {parseFloat(submission.scores[0].total_score).toFixed(1)}/100
                                    </Badge>
                                  )}
                                  {submission.final_score && (
                                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                                      Final Score: {submission.final_score}/100
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2 mt-4">
                                  {submission.repository_url && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(submission.repository_url, '_blank')}
                                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                    >
                                      Repository
                                    </Button>
                                  )}
                                  {submission.pitch_deck_url && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(submission.pitch_deck_url, '_blank')}
                                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                    >
                                      Pitch Deck
                                    </Button>
                                  )}
                                  {submission.demo_video_url && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(submission.demo_video_url, '_blank')}
                                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                    >
                                      Demo Video
                                    </Button>
                                  )}
                                  {submission.scores && submission.scores.length > 0 && (
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                                          <Eye className="h-4 w-4 mr-1" />
                                          View Score Details
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-2xl bg-white border-gray-200">
                                        <DialogHeader>
                                          <DialogTitle className="text-gray-900">Your Score & Feedback</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <div>
                                            <h4 className="font-semibold mb-2 text-gray-900">Overall Score</h4>
                                            <p className="text-2xl font-bold text-blue-600">{parseFloat(submission.scores[0].total_score).toFixed(1)}/100</p>
                                          </div>
                                          
                                          <div>
                                            <h4 className="font-semibold mb-2 text-gray-900">GitHub Repository Analysis</h4>
                                            <div className="border border-gray-300 p-3 rounded bg-gray-50">
                                              <div className="flex justify-between items-center mb-2">
                                                <span className="font-medium text-gray-900">Repository Validation</span>
                                                <span className="font-bold text-blue-600">{submission.scores[0].pre_screening_score}/5</span>
                                              </div>
                                              <p className="text-sm text-gray-700">
                                                {submission.scores[0].pre_screening_score === 5 
                                                  ? "✅ Repository exists and contains README.md" 
                                                  : "❌ Repository validation failed - missing repository or README.md"}
                                              </p>
                                            </div>
                                          </div>
                                          
                                          {submission.scores[0].llm_scores && (
                                            <div>
                                              <h4 className="font-semibold mb-2 text-gray-900">Detailed Rubric Scores</h4>
                                              <div className="space-y-2">
                                                {Object.entries(submission.scores[0].llm_scores).map(([criterion, scoreData]: [string, any]) => (
                                                  <div key={criterion} className="border border-gray-300 p-2 rounded bg-gray-50">
                                                    <div className="flex justify-between items-center mb-1">
                                                      <span className="font-medium text-gray-900">{criterion}</span>
                                                      <span className="font-bold text-blue-600">{scoreData.score?.toFixed(1)}/20</span>
                                                    </div>
                                                    <p className="text-sm text-gray-700">{scoreData.explanation}</p>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {submission.scores[0].feedback && (
                                            <div>
                                              <h4 className="font-semibold mb-2 text-gray-900">Feedback</h4>
                                              <div className="bg-gray-50 p-3 rounded text-sm text-gray-700">
                                                {submission.scores[0].feedback}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 ml-4">
                                <div className="text-sm text-gray-600">
                                  {new Date(submission.created_at).toLocaleDateString()}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(submission)}
                                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => deleteSubmission(submission.id)}
                                  disabled={deletingSubmissionId === submission.id}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  {deletingSubmissionId === submission.id ? (
                                    "Deleting..."
                                  ) : (
                                    <>
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Delete
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                            
                            {submission.readme_notes && (
                              <div className="mt-4 p-3 bg-white rounded text-sm border border-gray-200">
                                <strong className="text-gray-900">Notes:</strong> 
                                <span className="text-gray-700 ml-2">{submission.readme_notes}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Edit Submission Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-gray-200">
                    <DialogHeader>
                      <DialogTitle className="text-gray-900">Edit Submission</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="edit_repository_url" className="text-gray-900">Repository URL</Label>
                        <Input
                          id="edit_repository_url"
                          value={editFormData.repository_url}
                          onChange={(e) => setEditFormData({...editFormData, repository_url: e.target.value})}
                          placeholder="https://github.com/username/repo"
                          className="mt-1 border-gray-300 text-gray-900"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit_pitch_deck_url" className="text-gray-900">Pitch Deck URL</Label>
                        <Input
                          id="edit_pitch_deck_url"
                          value={editFormData.pitch_deck_url}
                          onChange={(e) => setEditFormData({...editFormData, pitch_deck_url: e.target.value})}
                          placeholder="https://drive.google.com/file/d/... or upload PDF below"
                          className="mt-1 border-gray-300 text-gray-900"
                        />
                      </div>

                      <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                        <Label className="text-sm font-medium mb-2 block text-gray-900">Upload Pitch Deck PDF</Label>
                        <p className="text-xs text-gray-600 mb-3">
                          Upload a PDF file directly to replace or set the pitch deck URL
                        </p>
                        <FileUpload
                          fileType="document"
                          title="Pitch Deck PDF"
                          description="Upload your pitch deck as a PDF file"
                          acceptedTypes=".pdf"
                          onUploadComplete={(url) => {
                            setEditFormData({...editFormData, pitch_deck_url: url});
                            toast({
                              title: "Success",
                              description: "PDF uploaded and pitch deck URL updated",
                            });
                          }}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit_demo_video_url" className="text-gray-900">Demo Video URL</Label>
                        <Input
                          id="edit_demo_video_url"
                          value={editFormData.demo_video_url}
                          onChange={(e) => setEditFormData({...editFormData, demo_video_url: e.target.value})}
                          placeholder="https://youtube.com/watch?v=..."
                          className="mt-1 border-gray-300 text-gray-900"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit_readme_notes" className="text-gray-900">Additional Notes</Label>
                        <Textarea
                          id="edit_readme_notes"
                          value={editFormData.readme_notes}
                          onChange={(e) => setEditFormData({...editFormData, readme_notes: e.target.value})}
                          placeholder="Any additional information about your solution..."
                          rows={3}
                          className="mt-1 border-gray-300 text-gray-900"
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsEditDialogOpen(false)}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={updateSubmission} 
                          disabled={updating}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {updating ? "Updating..." : "Update Submission"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </TabsContent>

              <TabsContent value="badges" className="mt-0">
                <BadgeCollection userId={user.id} />
              </TabsContent>

              <TabsContent value="files" className="mt-0">
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900 text-2xl flex items-center gap-2">
                      <Upload className="h-6 w-6" />
                      Document Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <FileUpload
                        fileType="cv"
                        title="Upload CV"
                        description="Upload your resume or CV (PDF, DOC, DOCX)"
                        acceptedTypes=".pdf,.doc,.docx"
                        onUploadComplete={handleFileUploaded}
                      />
                      
                      <FileUpload
                        fileType="document"
                        title="Upload Portfolio Documents"
                        description="Upload portfolio documents (PDF, DOC, DOCX, images)"
                        acceptedTypes=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onUploadComplete={handleFileUploaded}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {userRole === 'sponsor' && (
                <TabsContent value="my-challenges" className="mt-0">
                  <Card className="bg-white border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-gray-900 text-2xl flex items-center gap-2">
                        <Plus className="h-6 w-6" />
                        My Challenges
                        <Button 
                          onClick={() => navigate('/admin')}
                          className="ml-auto bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Challenge
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {challenges.length === 0 ? (
                        <div className="text-center py-12">
                          <Plus className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                          <p className="text-gray-600 text-lg">No challenges created yet</p>
                          <p className="text-gray-500 text-sm mt-2">Create your first challenge to get started!</p>
                          <Button 
                            onClick={() => navigate('/admin')}
                            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Challenge
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {challenges.map((challenge: any) => (
                            <div key={challenge.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900 text-lg">{challenge.title}</h3>
                                  <p className="text-gray-600 mt-1">{challenge.description}</p>
                                  <div className="flex items-center gap-2 mt-3">
                                    <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-800">
                                      {challenge.status || 'Active'}
                                    </Badge>
                                    {challenge.prize_amount && (
                                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                                        ${challenge.prize_amount}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <div className="text-sm text-gray-600">
                                    {new Date(challenge.submission_deadline).toLocaleDateString()}
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/challenges/${challenge.id}`)}
                                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {userRole === 'evaluator' && (
                <TabsContent value="evaluate" className="mt-0">
                  <Card className="bg-white border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-gray-900 text-2xl flex items-center gap-2">
                        <Gavel className="h-6 w-6" />
                        Evaluate Submissions
                        <Button 
                          onClick={() => navigate('/admin')}
                          className="ml-auto bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <Gavel className="h-4 w-4 mr-2" />
                          Go to Evaluation Panel
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <Gavel className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 text-lg">Evaluation Panel</p>
                        <p className="text-gray-500 text-sm mt-2">Access the admin panel to evaluate submissions</p>
                        <Button 
                          onClick={() => navigate('/admin')}
                          className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <Gavel className="h-4 w-4 mr-2" />
                          Start Evaluating
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
