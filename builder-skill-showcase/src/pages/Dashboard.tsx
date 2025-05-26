
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
import { User, FileText, Trophy, Upload, Trash2, Edit, Eye } from "lucide-react";
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
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
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
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
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profileData,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

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

    // Add confirmation dialog
    const confirmed = window.confirm("Are you sure you want to delete this submission? This action cannot be undone.");
    if (!confirmed) return;

    setDeletingSubmissionId(submissionId);
    try {
      console.log('Attempting to delete submission:', submissionId);
      console.log('User ID:', user.id);

      // First check if the submission exists and belongs to the user
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

      // Delete any related scores first
      const { error: scoresError } = await supabase
        .from('scores')
        .delete()
        .eq('submission_id', submissionId);

      if (scoresError) {
        console.warn('Error deleting related scores:', scoresError);
        // Continue with submission deletion even if scores deletion fails
      }

      // Delete the submission
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

      // Refresh submissions list
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
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-white/80">Manage your profile and track your submissions</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="submissions">My Submissions</TabsTrigger>
            <TabsTrigger value="files">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={profileData.username}
                      onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={profileData.location}
                      onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="experience_level">Experience Level</Label>
                    <Input
                      id="experience_level"
                      value={profileData.experience_level}
                      onChange={(e) => setProfileData({...profileData, experience_level: e.target.value})}
                      placeholder="e.g., Junior, Mid-level, Senior"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="github_url">GitHub URL</Label>
                  <Input
                    id="github_url"
                    value={profileData.github_url}
                    onChange={(e) => setProfileData({...profileData, github_url: e.target.value})}
                    placeholder="https://github.com/yourusername"
                  />
                </div>

                <div>
                  <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                  <Input
                    id="linkedin_url"
                    value={profileData.linkedin_url}
                    onChange={(e) => setProfileData({...profileData, linkedin_url: e.target.value})}
                    placeholder="https://linkedin.com/in/yourusername"
                  />
                </div>

                <div>
                  <Label htmlFor="portfolio_url">Portfolio URL</Label>
                  <Input
                    id="portfolio_url"
                    value={profileData.portfolio_url}
                    onChange={(e) => setProfileData({...profileData, portfolio_url: e.target.value})}
                    placeholder="https://yourportfolio.com"
                  />
                </div>

                <Button onClick={updateProfile} disabled={updating}>
                  {updating ? "Updating..." : "Update Profile"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  My Submissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No submissions yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((submission: any) => (
                      <div key={submission.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{submission.challenges?.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              Company: {submission.challenges?.company_name || 'N/A'}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{submission.status}</Badge>
                              {submission.scores && submission.scores.length > 0 && (
                                <Badge variant="secondary">
                                  AI Score: {parseFloat(submission.scores[0].total_score).toFixed(1)}/100
                                </Badge>
                              )}
                              {submission.final_score && (
                                <Badge>Final Score: {submission.final_score}/100</Badge>
                              )}
                            </div>
                            
                            {/* Show submission links */}
                            <div className="flex items-center gap-2 mt-3">
                              {submission.repository_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(submission.repository_url, '_blank')}
                                >
                                  Repository
                                </Button>
                              )}
                              {submission.pitch_deck_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(submission.pitch_deck_url, '_blank')}
                                >
                                  Pitch Deck
                                </Button>
                              )}
                              {submission.demo_video_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(submission.demo_video_url, '_blank')}
                                >
                                  Demo Video
                                </Button>
                              )}
                              {submission.scores && submission.scores.length > 0 && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Eye className="h-4 w-4 mr-1" />
                                      View Score Details
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Your Score & Feedback</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <h4 className="font-semibold mb-2">Overall Score</h4>
                                        <p className="text-2xl font-bold">{parseFloat(submission.scores[0].total_score).toFixed(1)}/100</p>
                                      </div>
                                      
                                      <div>
                                        <h4 className="font-semibold mb-2">GitHub Repository Analysis</h4>
                                        <div className="border p-3 rounded bg-muted/50">
                                          <div className="flex justify-between items-center mb-2">
                                            <span className="font-medium">Repository Validation</span>
                                            <span className="font-bold">{submission.scores[0].pre_screening_score}/5</span>
                                          </div>
                                          <p className="text-sm text-muted-foreground">
                                            {submission.scores[0].pre_screening_score === 5 
                                              ? "✅ Repository exists and contains README.md" 
                                              : "❌ Repository validation failed - missing repository or README.md"}
                                          </p>
                                        </div>
                                      </div>
                                      
                                      {submission.scores[0].llm_scores && (
                                        <div>
                                          <h4 className="font-semibold mb-2">Detailed Rubric Scores</h4>
                                          <div className="space-y-2">
                                            {Object.entries(submission.scores[0].llm_scores).map(([criterion, scoreData]: [string, any]) => (
                                              <div key={criterion} className="border p-2 rounded">
                                                <div className="flex justify-between items-center mb-1">
                                                  <span className="font-medium">{criterion}</span>
                                                  <span className="font-bold">{scoreData.score?.toFixed(1)}/20</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{scoreData.explanation}</p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {submission.scores[0].feedback && (
                                        <div>
                                          <h4 className="font-semibold mb-2">Feedback</h4>
                                          <div className="bg-muted p-3 rounded text-sm">
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
                          
                          <div className="flex items-center gap-2">
                            <div className="text-sm text-muted-foreground">
                              {new Date(submission.created_at).toLocaleDateString()}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(submission)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteSubmission(submission.id)}
                              disabled={deletingSubmissionId === submission.id}
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
                          <div className="mt-3 p-2 bg-muted rounded text-sm">
                            <strong>Notes:</strong> {submission.readme_notes}
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
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Submission</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit_repository_url">Repository URL</Label>
                    <Input
                      id="edit_repository_url"
                      value={editFormData.repository_url}
                      onChange={(e) => setEditFormData({...editFormData, repository_url: e.target.value})}
                      placeholder="https://github.com/username/repo"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit_pitch_deck_url">Pitch Deck URL</Label>
                    <Input
                      id="edit_pitch_deck_url"
                      value={editFormData.pitch_deck_url}
                      onChange={(e) => setEditFormData({...editFormData, pitch_deck_url: e.target.value})}
                      placeholder="https://drive.google.com/file/d/... or upload PDF below"
                    />
                  </div>

                  {/* PDF Upload Section */}
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <Label className="text-sm font-medium mb-2 block">Upload Pitch Deck PDF</Label>
                    <p className="text-xs text-muted-foreground mb-3">
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
                    <Label htmlFor="edit_demo_video_url">Demo Video URL</Label>
                    <Input
                      id="edit_demo_video_url"
                      value={editFormData.demo_video_url}
                      onChange={(e) => setEditFormData({...editFormData, demo_video_url: e.target.value})}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit_readme_notes">Additional Notes</Label>
                    <Textarea
                      id="edit_readme_notes"
                      value={editFormData.readme_notes}
                      onChange={(e) => setEditFormData({...editFormData, readme_notes: e.target.value})}
                      placeholder="Any additional information about your solution..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={updateSubmission} disabled={updating}>
                      {updating ? "Updating..." : "Update Submission"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="files">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
