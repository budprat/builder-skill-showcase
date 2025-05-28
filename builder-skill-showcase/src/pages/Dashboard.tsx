import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { User, Settings, Trophy, Upload, Plus, Edit, Trash2, ExternalLink, Star, FileText, Eye, Users, MapPin, Mail, Github, Linkedin, Globe, Gavel } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/files/FileUpload";
import { BadgeCollection } from "@/components/badges/BadgeCollection";
import EvaluatorSubmissionManager from "@/components/evaluator/EvaluatorSubmissionManager";
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
  const [isCreateChallengeDialogOpen, setIsCreateChallengeDialogOpen] = useState(false);
  const [challengeFormData, setChallengeFormData] = useState({
    title: "",
    description: "",
    problem_statement: "",
    requirements: "",
    submission_deadline: "",
    prize_amount: "",
    prize_description: "",
    difficulty_level: "",
    challenge_type: "",
    company_name: "",
    domains: "",
    deliverables_repository: "",
    deliverables_pitch_deck: "",
    deliverables_demo_video: "",
    evaluation_technical: "",
    evaluation_innovation: "",
    evaluation_presentation: "",
    evaluation_practicality: "",
    rules_participation: "",
    rules_original_work: "",
    rules_code_accessibility: "",
    rules_deadline: "",
    rules_judging_period: "",
    image_url: "",
    image_urls: [] as string[],
    status: "active",
  });

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

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (file: File): Promise<string> => {
    setUploadingImage(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be logged in to upload images');

      const fileExt = file.name.split('.').pop();
      const fileName = `challenges/${Date.now()}_${Math.random()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-files')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePrimaryImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imageUrl = await handleImageUpload(file);
      setChallengeFormData(prev => ({ ...prev, image_url: imageUrl }));
      toast({
        title: "Success",
        description: "Primary image uploaded successfully",
      });
    } catch (error) {
      // Error already handled in handleImageUpload
    }
  };

  const handleAdditionalImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    try {
      const uploadPromises = files.map(file => handleImageUpload(file));
      const imageUrls = await Promise.all(uploadPromises);

      setChallengeFormData(prev => ({ 
        ...prev, 
        image_urls: [...prev.image_urls, ...imageUrls] 
      }));

      toast({
        title: "Success",
        description: `${files.length} additional image(s) uploaded successfully`,
      });
    } catch (error) {
      // Error already handled in handleImageUpload
    }
  };

  const removeAdditionalImage = (index: number) => {
    setChallengeFormData(prev => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index)
    }));
  };

  const createChallenge = async () => {
    if (!user || userRole !== 'sponsor') return;

    setUpdating(true);
    try {
      const deliverables = {
        repository: challengeFormData.deliverables_repository,
        pitch_deck: challengeFormData.deliverables_pitch_deck,
        demo_video: challengeFormData.deliverables_demo_video,
      };

      const evaluation_rubric = {
        technical_implementation: challengeFormData.evaluation_technical ? parseInt(challengeFormData.evaluation_technical) : null,
        innovation: challengeFormData.evaluation_innovation ? parseInt(challengeFormData.evaluation_innovation) : null,
        presentation: challengeFormData.evaluation_presentation ? parseInt(challengeFormData.evaluation_presentation) : null,
        practicality: challengeFormData.evaluation_practicality ? parseInt(challengeFormData.evaluation_practicality) : null,
      };

      const challengeData = {
        title: challengeFormData.title,
        description: challengeFormData.description,
        problem_statement: challengeFormData.problem_statement,
        prize_amount: challengeFormData.prize_amount ? parseInt(challengeFormData.prize_amount) : null,
        prize_description: challengeFormData.prize_description,
        submission_deadline: challengeFormData.submission_deadline,
        difficulty_level: challengeFormData.difficulty_level,
        challenge_type: challengeFormData.challenge_type,
        company_id: user.id,
        company_name: challengeFormData.company_name || profileData.full_name || user.email?.split('@')[0] || 'Company',
        domains: challengeFormData.domains.split(',').map(d => d.trim()).filter(d => d.length > 0),
        deliverables: deliverables,
        evaluation_rubric: evaluation_rubric,
        image_url: challengeFormData.image_url || null,
        image_urls: challengeFormData.image_urls,
        status: challengeFormData.status,
        created_at: new Date().toISOString(),
      };

      const { error, data } = await supabase
        .from('challenges')
        .insert([challengeData])
        .select();

      if (error) throw error;

      // Create rules and guidelines for new challenge
      if (data && data.length > 0) {
        const challengeId = data[0].id;
        const rulesData = [
          {
            challenge_id: challengeId,
            rule_type: 'participation',
            title: 'Solo/Team Participation',
            description: challengeFormData.rules_participation,
            is_mandatory: true,
            order_index: 1
          },
          {
            challenge_id: challengeId,
            rule_type: 'submission',
            title: 'Original Work Required',
            description: challengeFormData.rules_original_work,
            is_mandatory: true,
            order_index: 2
          },
          {
            challenge_id: challengeId,
            rule_type: 'technical',
            title: 'Code Accessibility',
            description: challengeFormData.rules_code_accessibility,
            is_mandatory: true,
            order_index: 3
          },
          {
            challenge_id: challengeId,
            rule_type: 'submission',
            title: 'Deadline Compliance',
            description: challengeFormData.rules_deadline,
            is_mandatory: true,
            order_index: 4
          },
          {
            challenge_id: challengeId,
            rule_type: 'judging',
            title: 'Judging Period',
            description: challengeFormData.rules_judging_period,
            is_mandatory: false,
            order_index: 5
          }
        ];

        const { error: rulesError } = await supabase
          .from('rules_guidelines')
          .insert(rulesData);

        if (rulesError) {
          console.error('Error creating rules:', rulesError);
        }
      }

      toast({
        title: "Success",
        description: "Challenge created successfully",
      });

      setIsCreateChallengeDialogOpen(false);
      setChallengeFormData({
        title: "",
        description: "",
        problem_statement: "",
        requirements: "",
        submission_deadline: "",
        prize_amount: "",
        prize_description: "",
        difficulty_level: "",
        challenge_type: "",
        company_name: "",
        domains: "",
        deliverables_repository: "",
        deliverables_pitch_deck: "",
        deliverables_demo_video: "",
        evaluation_technical: "",
        evaluation_innovation: "",
        evaluation_presentation: "",
        evaluation_practicality: "",
        rules_participation: "",
        rules_original_work: "",
        rules_code_accessibility: "",
        rules_deadline: "",
        rules_judging_period: "",
        image_url: "",
        image_urls: [] as string[],
        status: "active",
      });
      await fetchChallenges();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create challenge",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
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

  const handleProfileUpdate = async (updatedData: any) => {
    if (!user) return;

    try {
      // Sanitize inputs
      const sanitizedData = {
        ...updatedData,
        full_name: updatedData.full_name?.trim().substring(0, 100),
        bio: updatedData.bio?.trim().substring(0, 500),
        location: updatedData.location?.trim().substring(0, 100),
        github_url: updatedData.github_url?.trim().match(/^https:\/\/github\.com\/[a-zA-Z0-9-]+\/?$/) ? updatedData.github_url : null,
        linkedin_url: updatedData.linkedin_url?.trim().match(/^https:\/\/linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/) ? updatedData.linkedin_url : null,
        portfolio_url: updatedData.portfolio_url?.trim().match(/^https?:\/\/[^\s<>"]+$/) ? updatedData.portfolio_url : null,
      };

      const { error } = await supabase
        .from('profiles')
        .update(sanitizedData)
        .eq('id', user.id);

      if (error) {
        throw error;
      }
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      fetchProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    }
  };


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
                    {(userRole === 'participant' || userRole === 'admin') && (
                      <TabsTrigger 
                        value="submissions" 
                        className="w-full justify-start bg-transparent text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 hover:bg-gray-50"
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        Submissions ({submissions.length})
                      </TabsTrigger>
                    )}
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
                    {(userRole === 'sponsor' || userRole === 'admin') && (
                      <TabsTrigger 
                        value="my-challenges" 
                        className="w-full justify-start bg-transparent text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 hover:bg-gray-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        My Challenges ({challenges.length})
                      </TabsTrigger>
                    )}
                    {(userRole === 'evaluator' || userRole === 'admin') && (
                      <TabsTrigger 
                        value="evaluate" 
                        className="w-full justify-start bg-transparent text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 hover:bg-gray-50"
                      >
                        <Gavel className="h-4 w-4 mr-2" />
                        Evaluate Submissions
                      </TabsTrigger>
                    )}
                    {(userRole === 'sponsor' || userRole === 'company') && (
                      <TabsTrigger 
                        value="manage-submissions" 
                        className="w-full justify-start bg-transparent text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 hover:bg-gray-50"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Manage Submissions
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
                    <p className="text-sm text-gray-600">Role: {userRole || 'Loading...'}</p>
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
                          value={profileData.experiencelevel}
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
                      onClick={() => handleProfileUpdate(profileData)}
                      disabled={updating}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {updating ? "Updating..." : "Update Profile"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {(userRole === 'participant' || userRole === 'admin') && (
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
              )}

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

              {(userRole === 'sponsor' || userRole === 'admin') && (
                <TabsContent value="my-challenges" className="mt-0">
                  <Card className="bg-white border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-gray-900 text-2xl flex items-center gap-2">
                        <Plus className="h-6 w-6" />
                        My Challenges
                        <Dialog open={isCreateChallengeDialogOpen} onOpenChange={setIsCreateChallengeDialogOpen}>
                          <DialogTrigger asChild>
                            <Button className="ml-auto bg-blue-600 hover:bg-blue-700 text-white">
                              <Plus className="h-4 w-4 mr-2" />
                              Create Challenge
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-gray-200">
                            <DialogHeader>
                              <DialogTitle className="text-gray-900">Create New Challenge</DialogTitle>
                              <DialogDescription>
                                Create a new coding challenge for participants to solve
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="challenge_title" className="text-gray-900">Challenge Title</Label>
                                <Input
                                  id="challenge_title"
                                  value={challengeFormData.title}
                                  onChange={(e) => setChallengeFormData({...challengeFormData, title: e.target.value})}
                                  placeholder="Enter challenge title"
                                  className="mt-1 border-gray-300 text-gray-900"
                                />
                              </div>

                              <div>
                                <Label htmlFor="challenge_description" className="text-gray-900">Description</Label>
                                <Textarea
                                  id="challenge_description"
                                  value={challengeFormData.description}
                                  onChange={(e) => setChallengeFormData({...challengeFormData, description: e.target.value})}
                                  placeholder="Describe the challenge in detail"
                                  rows={3}
                                  className="mt-1 border-gray-300 text-gray-900"
                                />
                              </div>

                              <div>
                                <Label htmlFor="challenge_problem_statement" className="text-gray-900">Problem Statement</Label>
                                <Textarea
                                  id="challenge_problem_statement"
                                  value={challengeFormData.problem_statement}
                                  onChange={(e) => setChallengeFormData({...challengeFormData, problem_statement: e.target.value})}
                                  placeholder="Describe the specific problem participants need to solve..."
                                  rows={4}
                                  className="mt-1 border-gray-300 text-gray-900"
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="challenge_prize" className="text-gray-900">Prize Amount ($)</Label>
                                  <Input
                                    id="challenge_prize"
                                    type="number"
                                    value={challengeFormData.prize_amount}
                                    onChange={(e) => setChallengeFormData({...challengeFormData, prize_amount: e.target.value})}
                                    placeholder="1000"
                                    className="mt-1 border-gray-300 text-gray-900"
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="challenge_prize_description" className="text-gray-900">Prize Description</Label>
                                  <Input
                                    id="challenge_prize_description"
                                    value={challengeFormData.prize_description}
                                    onChange={(e) => setChallengeFormData({...challengeFormData, prize_description: e.target.value})}
                                    placeholder="Cash prize and internship opportunity"
                                    className="mt-1 border-gray-300 text-gray-900"
                                  />
                                </div>
                              </div>

                              <div>
                                <Label htmlFor="challenge_deadline" className="text-gray-900">Submission Deadline</Label>
                                <Input
                                  id="challenge_deadline"
                                  type="datetime-local"
                                  value={challengeFormData.submission_deadline}
                                  onChange={(e) => setChallengeFormData({...challengeFormData, submission_deadline: e.target.value})}
                                  className="mt-1 border-gray-300 text-gray-900"
                                />
                              </div>

                              <div>
                                <Label htmlFor="challenge_company_name" className="text-gray-900">Company Name</Label>
                                <Input
                                  id="challenge_company_name"
                                  value={challengeFormData.company_name}
                                  onChange={(e) => setChallengeFormData({...challengeFormData, company_name: e.target.value})}
                                  placeholder="Your company name"
                                  className="mt-1 border-gray-300 text-gray-900"
                                />
                              </div>

                              <div>
                                <Label htmlFor="challenge_domains" className="text-gray-900">Domains (comma-separated)</Label>
                                <Input
                                  id="challenge_domains"
                                  value={challengeFormData.domains}
                                  onChange={(e) => setChallengeFormData({...challengeFormData, domains: e.target.value})}
                                  placeholder="AI, Machine Learning, Computer Vision"
                                  className="mt-1 border-gray-300 text-gray-900"
                                />
                              </div>

                              <div className="space-y-4">
                                <Label className="text-base font-semibold text-gray-900">Required Deliverables</Label>
                                <div className="grid grid-cols-1 gap-3">
                                  <div>
                                    <Label htmlFor="deliverables_repository" className="text-gray-900">Repository Requirements</Label>
                                    <Input
                                      id="deliverables_repository"
                                      value={challengeFormData.deliverables_repository}
                                      onChange={(e) => setChallengeFormData({...challengeFormData, deliverables_repository: e.target.value})}
                                      placeholder="Complete source code with training scripts"
                                      className="mt-1 border-gray-300 text-gray-900"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="deliverables_pitch_deck" className="text-gray-900">Pitch Deck Requirements</Label>
                                    <Input
                                      id="deliverables_pitch_deck"
                                      value={challengeFormData.deliverables_pitch_deck}
                                      onChange={(e) => setChallengeFormData({...challengeFormData, deliverables_pitch_deck: e.target.value})}
                                      placeholder="5-10 slide presentation"
                                      className="mt-1 border-gray-300 text-gray-900"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="deliverables_demo_video" className="text-gray-900">Demo Video Requirements</Label>
                                    <Input
                                      id="deliverables_demo_video"
                                      value={challengeFormData.deliverables_demo_video}
                                      onChange={(e) => setChallengeFormData({...challengeFormData, deliverables_demo_video: e.target.value})}
                                      placeholder="3-5 minute demonstration"
                                      className="mt-1 border-gray-300 text-gray-900"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <Label className="text-base font-semibold text-gray-900">Evaluation Criteria (percentages must add up to 100)</Label>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label htmlFor="evaluation_technical" className="text-gray-900">Technical Implementation (%)</Label>
                                    <Input
                                      id="evaluation_technical"
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={challengeFormData.evaluation_technical}
                                      onChange={(e) => setChallengeFormData({...challengeFormData, evaluation_technical: e.target.value})}
                                      placeholder="40"
                                      className="mt-1 border-gray-300 text-gray-900"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="evaluation_innovation" className="text-gray-900">Innovation (%)</Label>
                                    <Input
                                      id="evaluation_innovation"
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={challengeFormData.evaluation_innovation}
                                      onChange={(e) => setChallengeFormData({...challengeFormData, evaluation_innovation: e.target.value})}
                                      placeholder="25"
                                      className="mt-1 border-gray-300 text-gray-900"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="evaluation_presentation" className="text-gray-900">Presentation (%)</Label>
                                    <Input
                                      id="evaluation_presentation"
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={challengeFormData.evaluation_presentation}
                                      onChange={(e) => setChallengeFormData({...challengeFormData, evaluation_presentation: e.target.value})}
                                      placeholder="20"
                                      className="mt-1 border-gray-300 text-gray-900"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="evaluation_practicality" className="text-gray-900">Practicality (%)</Label>
                                    <Input
                                      id="evaluation_practicality"
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={challengeFormData.evaluation_practicality}
                                      onChange={(e) => setChallengeFormData({...challengeFormData, evaluation_practicality: e.target.value})}
                                      placeholder="15"
                                      className="mt-1 border-gray-300 text-gray-900"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <Label className="text-base font-semibold text-gray-900">Challenge Images</Label>
                                <div className="grid grid-cols-1 gap-4">
                                  <div>
                                    <Label htmlFor="primary_image" className="text-gray-900">Primary Challenge Image</Label>
                                    <Input
                                      id="primary_image"
                                      type="file"
                                      accept="image/*"
                                      onChange={handlePrimaryImageChange}
                                      disabled={uploadingImage}
                                      className="mt-1 border-gray-300 text-gray-900"
                                    />
                                    {challengeFormData.image_url && (
                                      <div className="mt-2">
                                        <img 
                                          src={challengeFormData.image_url} 
                                          alt="Primary challenge" 
                                          className="w-32 h-32 object-cover rounded border"
                                        />
                                      </div>
                                    )}
                                  </div>

                                  <div>
                                    <Label htmlFor="additional_images" className="text-gray-900">Additional Images (Optional)</Label>
                                    <Input
                                      id="additional_images"
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      onChange={handleAdditionalImageChange}
                                      disabled={uploadingImage}
                                      className="mt-1 border-gray-300 text-gray-900"
                                    />
                                    {challengeFormData.image_urls.length > 0 && (
                                      <div className="mt-2 grid grid-cols-4 gap-2">
                                        {challengeFormData.image_urls.map((url, index) => (
                                          <div key={index} className="relative">
                                            <img 
                                              src={url} 
                                              alt={`Additional ${index + 1}`} 
                                              className="w-20 h-20 object-cover rounded border"
                                            />
                                            <Button
                                              type="button"
                                              variant="destructive"
                                              size="sm"
                                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                              onClick={() => removeAdditionalImage(index)}
                                            >
                                              ×
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {uploadingImage && (
                                  <p className="text-sm text-blue-600">Uploading image(s)...</p>
                                )}
                              </div>

                              <div className="space-y-4">
                                <Label className="text-base font-semibold text-gray-900">Rules and Guidelines</Label>
                                <div className="grid grid-cols-1 gap-3">
                                  <div>
                                    <Label htmlFor="rules_participation" className="text-gray-900">Solo/Team Participation</Label>
                                    <Textarea
                                      id="rules_participation"
                                      value={challengeFormData.rules_participation}
                                      onChange={(e) => setChallengeFormData({...challengeFormData, rules_participation: e.target.value})}
                                      placeholder="Specify if solo or team participation is allowed, and team size limit"
                                      className="mt-1 border-gray-300 text-gray-900"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="rules_original_work" className="text-gray-900">Original Work Required</Label>
                                    <Textarea
                                      id="rules_original_work"
                                      value={challengeFormData.rules_original_work}
                                      onChange={(e) => setChallengeFormData({...challengeFormData, rules_original_work: e.target.value})}
                                      placeholder="State that only original work is accepted"
                                      className="mt-1 border-gray-300 text-gray-900"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="rules_code_accessibility" className="text-gray-900">Code Must Be Publicly Accessible</Label>
                                    <Textarea
                                      id="rules_code_accessibility"
                                      value={challengeFormData.rules_code_accessibility}
                                      onChange={(e) => setChallengeFormData({...challengeFormData, rules_code_accessibility: e.target.value})}
                                      placeholder="Specify that code must be publicly accessible"
                                      className="mt-1 border-gray-300 text-gray-900"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="rules_deadline" className="text-gray-900">All Deliverables Must Be Submitted By Deadline</Label>
                                    <Textarea
                                      id="rules_deadline"
                                      value={challengeFormData.rules_deadline}
                                      onChange={(e) => setChallengeFormData({...challengeFormData, rules_deadline: e.target.value})}
                                      placeholder="State that all deliverables must be submitted by the deadline"
                                      className="mt-1 border-gray-300 text-gray-900"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="rules_judging_period" className="text-gray-900">Judging Period: 1-2 weeks after deadline</Label>
                                    <Textarea
                                      id="rules_judging_period"
                                      value={challengeFormData.rules_judging_period}
                                      onChange={(e) => setChallengeFormData({...challengeFormData, rules_judging_period: e.target.value})}
                                      placeholder="Specify the judging period"
                                      className="mt-1 border-gray-300 text-gray-900"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="challenge_difficulty" className="text-gray-900">Difficulty Level</Label>
                                  <Select value={challengeFormData.difficulty_level} onValueChange={(value) => setChallengeFormData({...challengeFormData, difficulty_level: value})}>
                                    <SelectTrigger className="mt-1 border-gray-300 text-gray-900">
                                      <SelectValue placeholder="Select difficulty" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="beginner">Beginner</SelectItem>
                                      <SelectItem value="intermediate">Intermediate</SelectItem>
                                      <SelectItem value="advanced">Advanced</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label htmlFor="challenge_type" className="text-gray-900">Challenge Type</Label>
                                  <Select value={challengeFormData.challenge_type} onValueChange={(value) => setChallengeFormData({...challengeFormData, challenge_type: value})}>
                                    <SelectTrigger className="mt-1 border-gray-300 text-gray-900">
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="web_development">Web Development</SelectItem>
                                      <SelectItem value="mobile_development">Mobile Development</SelectItem>
                                      <SelectItem value="data_science">Data Science</SelectItem>
                                      <SelectItem value="machine_learning">Machine Learning</SelectItem>
                                      <SelectItem value="algorithms">Algorithms</SelectItem>
                                      <SelectItem value="system_design">System Design</SelectItem>
                                      <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div>
                                <Label htmlFor="challenge_status" className="text-gray-900">Status</Label>
                                <Select value={challengeFormData.status} onValueChange={(value) => setChallengeFormData({...challengeFormData, status: value})}>
                                  <SelectTrigger className="mt-1 border-gray-300 text-gray-900">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="judging">Judging</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex justify-end space-x-2 pt-4">
                                <Button 
                                  variant="outline" 
                                  onClick={() => setIsCreateChallengeDialogOpen(false)}
                                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={createChallenge} 
                                  disabled={updating || !challengeFormData.title || !challengeFormData.description}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  {updating ? "Creating..." : "Create Challenge"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {challenges.length === 0 ? (
                        <div className="text-center py-12">
                          <Plus className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                          <p className="text-gray-600 text-lg">No challenges created yet</p>
                          <p className="text-gray-500 text-sm mt-2">Create your first challenge to get started!</p>
                          <Button 
                            onClick={() => setIsCreateChallengeDialogOpen(true)}
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

              {(userRole === 'evaluator' || userRole === 'admin') && (
                <TabsContent value="evaluate" className="mt-0">
                  <EvaluatorSubmissionManager />
                </TabsContent>
              )}

              {(userRole === 'sponsor' || userRole === 'company') && (
                <TabsContent value="manage-submissions" className="mt-0">
                  <Card className="bg-white border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-gray-900 text-2xl flex items-center gap-2">
                        <Users className="h-6 w-6" />
                        Manage Challenge Submissions
                      </CardTitle>
                      <CardDescription>
                        View and manage submissions for your challenges
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 text-lg">Submission management coming soon</p>
                        <p className="text-gray-500 text-sm mt-2">
                          You can view submissions for your challenges here once they are submitted.
                        </p>
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