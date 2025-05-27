
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
import { User, FileText, Trophy, Upload, Trash2, Edit, Eye, Settings, MapPin, Github, Linkedin, Globe, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/files/FileUpload";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Submission = Tables<"submissions">;

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
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
    }
  }, [user]);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Please sign in to view your dashboard</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs defaultValue="profile" className="space-y-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:w-64 shrink-0">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">
                      {profileData.full_name || "User"}
                    </h2>
                    <p className="text-white/70">
                      @{profileData.username || "username"}
                    </p>
                  </div>
                  
                  <TabsList className="flex flex-col h-auto w-full bg-transparent p-0 space-y-1">
                    <TabsTrigger 
                      value="profile" 
                      className="w-full justify-start bg-white/5 text-white data-[state=active]:bg-white/20 hover:bg-white/10"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </TabsTrigger>
                    <TabsTrigger 
                      value="edit-profile" 
                      className="w-full justify-start bg-white/5 text-white data-[state=active]:bg-white/20 hover:bg-white/10"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Profile
                    </TabsTrigger>
                    <TabsTrigger 
                      value="submissions" 
                      className="w-full justify-start bg-white/5 text-white data-[state=active]:bg-white/20 hover:bg-white/10"
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      Submissions ({submissions.length})
                    </TabsTrigger>
                    <TabsTrigger 
                      value="files" 
                      className="w-full justify-start bg-white/5 text-white data-[state=active]:bg-white/20 hover:bg-white/10"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Documents
                    </TabsTrigger>
                  </TabsList>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <TabsContent value="profile" className="mt-0">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white text-2xl">Profile Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-white/70 text-sm font-medium">Full Name</Label>
                          <p className="text-white text-lg font-medium mt-1">
                            {profileData.full_name || "Not provided"}
                          </p>
                        </div>
                        
                        <div>
                          <Label className="text-white/70 text-sm font-medium">Username</Label>
                          <p className="text-white text-lg font-medium mt-1">
                            @{profileData.username || "username"}
                          </p>
                        </div>

                        <div>
                          <Label className="text-white/70 text-sm font-medium">Experience Level</Label>
                          <div className="mt-1">
                            <Badge variant="outline" className="bg-white/10 border-white/30 text-white">
                              {profileData.experience_level ? 
                                profileData.experience_level.charAt(0).toUpperCase() + profileData.experience_level.slice(1) 
                                : "Not specified"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-white/70 text-sm font-medium flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Location
                          </Label>
                          <p className="text-white text-lg font-medium mt-1">
                            {profileData.location || "Not provided"}
                          </p>
                        </div>

                        <div>
                          <Label className="text-white/70 text-sm font-medium flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                          </Label>
                          <p className="text-white text-lg font-medium mt-1">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <Label className="text-white/70 text-sm font-medium">Bio</Label>
                      <div className="mt-2 p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-white leading-relaxed">
                          {profileData.bio || "No bio provided"}
                        </p>
                      </div>
                    </div>

                    {/* Links */}
                    <div>
                      <Label className="text-white/70 text-sm font-medium">Links</Label>
                      <div className="mt-3 grid grid-cols-1 gap-3">
                        {profileData.github_url && (
                          <a 
                            href={profileData.github_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                          >
                            <Github className="h-5 w-5 text-white" />
                            <span className="text-white">GitHub Profile</span>
                          </a>
                        )}
                        {profileData.linkedin_url && (
                          <a 
                            href={profileData.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                          >
                            <Linkedin className="h-5 w-5 text-white" />
                            <span className="text-white">LinkedIn Profile</span>
                          </a>
                        )}
                        {profileData.portfolio_url && (
                          <a 
                            href={profileData.portfolio_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                          >
                            <Globe className="h-5 w-5 text-white" />
                            <span className="text-white">Portfolio Website</span>
                          </a>
                        )}
                        {!profileData.github_url && !profileData.linkedin_url && !profileData.portfolio_url && (
                          <p className="text-white/60 italic">No links provided</p>
                        )}
                      </div>
                    </div>

                    {/* Skills */}
                    {profileData.skills && profileData.skills.length > 0 && (
                      <div>
                        <Label className="text-white/70 text-sm font-medium">Skills</Label>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {profileData.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="bg-white/10 text-white border-white/20">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="edit-profile" className="mt-0">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white text-2xl flex items-center gap-2">
                      <Edit className="h-6 w-6" />
                      Edit Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="full_name" className="text-white">Full Name</Label>
                        <Input
                          id="full_name"
                          value={profileData.full_name}
                          onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                          className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="username" className="text-white">Username</Label>
                        <Input
                          id="username"
                          value={profileData.username}
                          onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                          className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="bio" className="text-white">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                        rows={4}
                        className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="location" className="text-white">Location</Label>
                        <Input
                          id="location"
                          value={profileData.location}
                          onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                          className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="experience_level" className="text-white">Experience Level</Label>
                        <select
                          id="experience_level"
                          value={profileData.experience_level}
                          onChange={(e) => setProfileData({...profileData, experience_level: e.target.value})}
                          className="mt-1 flex h-10 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="" className="bg-slate-900 text-white">Select experience level</option>
                          <option value="beginner" className="bg-slate-900 text-white">Beginner</option>
                          <option value="advanced" className="bg-slate-900 text-white">Advanced</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="github_url" className="text-white">GitHub URL</Label>
                        <Input
                          id="github_url"
                          value={profileData.github_url}
                          onChange={(e) => setProfileData({...profileData, github_url: e.target.value})}
                          placeholder="https://github.com/yourusername"
                          className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </div>

                      <div>
                        <Label htmlFor="linkedin_url" className="text-white">LinkedIn URL</Label>
                        <Input
                          id="linkedin_url"
                          value={profileData.linkedin_url}
                          onChange={(e) => setProfileData({...profileData, linkedin_url: e.target.value})}
                          placeholder="https://linkedin.com/in/yourusername"
                          className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </div>

                      <div>
                        <Label htmlFor="portfolio_url" className="text-white">Portfolio URL</Label>
                        <Input
                          id="portfolio_url"
                          value={profileData.portfolio_url}
                          onChange={(e) => setProfileData({...profileData, portfolio_url: e.target.value})}
                          placeholder="https://yourportfolio.com"
                          className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </div>
                    </div>

                    <Button 
                      onClick={updateProfile} 
                      disabled={updating}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    >
                      {updating ? "Updating..." : "Update Profile"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="submissions" className="mt-0">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white text-2xl flex items-center gap-2">
                      <Trophy className="h-6 w-6" />
                      My Submissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {submissions.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="h-16 w-16 mx-auto text-white/40 mb-4" />
                        <p className="text-white/60 text-lg">No submissions yet</p>
                        <p className="text-white/40 text-sm mt-2">Start by participating in challenges!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {submissions.map((submission: any) => (
                          <div key={submission.id} className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-white text-lg">{submission.challenges?.title}</h3>
                                <p className="text-white/70 mt-1">
                                  Company: {submission.challenges?.company_name || 'N/A'}
                                </p>
                                <div className="flex items-center gap-2 mt-3">
                                  <Badge variant="outline" className="bg-white/10 border-white/30 text-white">
                                    {submission.status}
                                  </Badge>
                                  {submission.scores && submission.scores.length > 0 && (
                                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-200 border-blue-400/30">
                                      AI Score: {parseFloat(submission.scores[0].total_score).toFixed(1)}/100
                                    </Badge>
                                  )}
                                  {submission.final_score && (
                                    <Badge className="bg-green-500/20 text-green-200 border-green-400/30">
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
                                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                    >
                                      Repository
                                    </Button>
                                  )}
                                  {submission.pitch_deck_url && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(submission.pitch_deck_url, '_blank')}
                                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                    >
                                      Pitch Deck
                                    </Button>
                                  )}
                                  {submission.demo_video_url && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(submission.demo_video_url, '_blank')}
                                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                    >
                                      Demo Video
                                    </Button>
                                  )}
                                  {submission.scores && submission.scores.length > 0 && (
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                                          <Eye className="h-4 w-4 mr-1" />
                                          View Score Details
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
                                        <DialogHeader>
                                          <DialogTitle className="text-white">Your Score & Feedback</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <div>
                                            <h4 className="font-semibold mb-2 text-white">Overall Score</h4>
                                            <p className="text-2xl font-bold text-blue-400">{parseFloat(submission.scores[0].total_score).toFixed(1)}/100</p>
                                          </div>
                                          
                                          <div>
                                            <h4 className="font-semibold mb-2 text-white">GitHub Repository Analysis</h4>
                                            <div className="border border-slate-600 p-3 rounded bg-slate-800">
                                              <div className="flex justify-between items-center mb-2">
                                                <span className="font-medium text-white">Repository Validation</span>
                                                <span className="font-bold text-blue-400">{submission.scores[0].pre_screening_score}/5</span>
                                              </div>
                                              <p className="text-sm text-slate-300">
                                                {submission.scores[0].pre_screening_score === 5 
                                                  ? "✅ Repository exists and contains README.md" 
                                                  : "❌ Repository validation failed - missing repository or README.md"}
                                              </p>
                                            </div>
                                          </div>
                                          
                                          {submission.scores[0].llm_scores && (
                                            <div>
                                              <h4 className="font-semibold mb-2 text-white">Detailed Rubric Scores</h4>
                                              <div className="space-y-2">
                                                {Object.entries(submission.scores[0].llm_scores).map(([criterion, scoreData]: [string, any]) => (
                                                  <div key={criterion} className="border border-slate-600 p-2 rounded bg-slate-800">
                                                    <div className="flex justify-between items-center mb-1">
                                                      <span className="font-medium text-white">{criterion}</span>
                                                      <span className="font-bold text-blue-400">{scoreData.score?.toFixed(1)}/20</span>
                                                    </div>
                                                    <p className="text-sm text-slate-300">{scoreData.explanation}</p>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {submission.scores[0].feedback && (
                                            <div>
                                              <h4 className="font-semibold mb-2 text-white">Feedback</h4>
                                              <div className="bg-slate-800 p-3 rounded text-sm text-slate-300">
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
                                <div className="text-sm text-white/60">
                                  {new Date(submission.created_at).toLocaleDateString()}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(submission)}
                                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => deleteSubmission(submission.id)}
                                  disabled={deletingSubmissionId === submission.id}
                                  className="bg-red-500/20 border-red-400/30 text-red-200 hover:bg-red-500/30"
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
                              <div className="mt-4 p-3 bg-white/5 rounded text-sm border border-white/10">
                                <strong className="text-white">Notes:</strong> 
                                <span className="text-white/80 ml-2">{submission.readme_notes}</span>
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
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Edit Submission</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="edit_repository_url" className="text-white">Repository URL</Label>
                        <Input
                          id="edit_repository_url"
                          value={editFormData.repository_url}
                          onChange={(e) => setEditFormData({...editFormData, repository_url: e.target.value})}
                          placeholder="https://github.com/username/repo"
                          className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit_pitch_deck_url" className="text-white">Pitch Deck URL</Label>
                        <Input
                          id="edit_pitch_deck_url"
                          value={editFormData.pitch_deck_url}
                          onChange={(e) => setEditFormData({...editFormData, pitch_deck_url: e.target.value})}
                          placeholder="https://drive.google.com/file/d/... or upload PDF below"
                          className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </div>

                      <div className="border border-white/20 rounded-lg p-4 bg-white/5">
                        <Label className="text-sm font-medium mb-2 block text-white">Upload Pitch Deck PDF</Label>
                        <p className="text-xs text-white/60 mb-3">
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
                        <Label htmlFor="edit_demo_video_url" className="text-white">Demo Video URL</Label>
                        <Input
                          id="edit_demo_video_url"
                          value={editFormData.demo_video_url}
                          onChange={(e) => setEditFormData({...editFormData, demo_video_url: e.target.value})}
                          placeholder="https://youtube.com/watch?v=..."
                          className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit_readme_notes" className="text-white">Additional Notes</Label>
                        <Textarea
                          id="edit_readme_notes"
                          value={editFormData.readme_notes}
                          onChange={(e) => setEditFormData({...editFormData, readme_notes: e.target.value})}
                          placeholder="Any additional information about your solution..."
                          rows={3}
                          className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsEditDialogOpen(false)}
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={updateSubmission} 
                          disabled={updating}
                          className="bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                        >
                          {updating ? "Updating..." : "Update Submission"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </TabsContent>

              <TabsContent value="files" className="mt-0">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white text-2xl flex items-center gap-2">
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
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
