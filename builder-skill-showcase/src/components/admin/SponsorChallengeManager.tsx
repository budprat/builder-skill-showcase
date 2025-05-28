
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

type Challenge = Tables<"challenges">;

export const SponsorChallengeManager = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    problem_statement: "",
    prize_amount: "",
    prize_description: "",
    submission_deadline: "",
    status: "active" as "active" | "draft" | "judging" | "completed",
    challenge_type: "standard" as "standard" | "hackathon" | "competition" | "bounty" | "research",
    difficulty_level: "intermediate" as "beginner" | "intermediate" | "advanced",
    company_name: "",
    domains: "",
    deliverables_repository: "",
    deliverables_pitch_deck: "",
    deliverables_demo_video: "",
    evaluation_technical: "",
    evaluation_innovation: "",
    evaluation_presentation: "",
    evaluation_practicality: "",
    image_url: "",
    image_urls: [] as string[],
  });

  useEffect(() => {
    fetchChallenges();
  }, []);

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
      toast({
        title: "Error",
        description: "Failed to fetch challenges",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSubmitting(true);

    try {
      const deliverables = {
        repository: formData.deliverables_repository,
        pitch_deck: formData.deliverables_pitch_deck,
        demo_video: formData.deliverables_demo_video,
      };

      const evaluation_rubric = {
        technical_implementation: formData.evaluation_technical ? parseInt(formData.evaluation_technical) : null,
        innovation: formData.evaluation_innovation ? parseInt(formData.evaluation_innovation) : null,
        presentation: formData.evaluation_presentation ? parseInt(formData.evaluation_presentation) : null,
        practicality: formData.evaluation_practicality ? parseInt(formData.evaluation_practicality) : null,
      };

      const challengeData = {
        title: formData.title,
        description: formData.description,
        problem_statement: formData.problem_statement,
        prize_amount: formData.prize_amount ? parseInt(formData.prize_amount) : null,
        prize_description: formData.prize_description,
        submission_deadline: formData.submission_deadline,
        status: formData.status,
        challenge_type: formData.challenge_type,
        difficulty_level: formData.difficulty_level,
        company_name: formData.company_name,
        company_id: user.id,
        domains: formData.domains.split(',').map(d => d.trim()).filter(d => d.length > 0),
        deliverables: deliverables,
        evaluation_rubric: evaluation_rubric,
        image_url: formData.image_url || null,
        image_urls: formData.image_urls,
      };

      if (editingChallenge) {
        const { error } = await supabase
          .from('challenges')
          .update(challengeData)
          .eq('id', editingChallenge.id)
          .eq('company_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('challenges')
          .insert([challengeData]);

        if (error) throw error;
      }

      setIsDialogOpen(false);
      resetForm();
      fetchChallenges();

      toast({
        title: "Success",
        description: editingChallenge ? "Challenge updated successfully" : "Challenge created successfully",
      });
    } catch (error: any) {
      console.error('Error saving challenge:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save challenge",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    setUploadingImage(true);
    try {
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
      setFormData(prev => ({ ...prev, image_url: imageUrl }));
      toast({
        title: "Success",
        description: "Primary image uploaded successfully",
      });
    } catch (error) {
      // Error already handled in handleImageUpload
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      problem_statement: "",
      prize_amount: "",
      prize_description: "",
      submission_deadline: "",
      status: "active",
      challenge_type: "standard",
      difficulty_level: "intermediate",
      company_name: "",
      domains: "",
      deliverables_repository: "",
      deliverables_pitch_deck: "",
      deliverables_demo_video: "",
      evaluation_technical: "",
      evaluation_innovation: "",
      evaluation_presentation: "",
      evaluation_practicality: "",
      image_url: "",
      image_urls: [],
    });
    setEditingChallenge(null);
  };

  const handleEdit = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    const deliverables = challenge.deliverables || {};
    const evaluation = challenge.evaluation_rubric || {};

    // Format the submission deadline for datetime-local input
    let formattedDeadline = "";
    if (challenge.submission_deadline) {
      const date = new Date(challenge.submission_deadline);
      // Format to YYYY-MM-DDTHH:MM for datetime-local input
      formattedDeadline = date.toISOString().slice(0, 16);
    }

    setFormData({
      title: challenge.title,
      description: challenge.description,
      problem_statement: challenge.problem_statement || "",
      prize_amount: challenge.prize_amount?.toString() || "",
      prize_description: challenge.prize_description || "",
      submission_deadline: formattedDeadline,
      status: challenge.status as "active" | "draft" | "judging" | "completed",
      challenge_type: (challenge as any).challenge_type || "standard",
      difficulty_level: (challenge as any).difficulty_level || "intermediate",
      company_name: challenge.company_name || "",
      domains: Array.isArray(challenge.domains) ? challenge.domains.join(", ") : "",
      deliverables_repository: deliverables.repository || "",
      deliverables_pitch_deck: deliverables.pitch_deck || "",
      deliverables_demo_video: deliverables.demo_video || "",
      evaluation_technical: evaluation.technical_implementation?.toString() || "",
      evaluation_innovation: evaluation.innovation?.toString() || "",
      evaluation_presentation: evaluation.presentation?.toString() || "",
      evaluation_practicality: evaluation.practicality?.toString() || "",
      image_url: challenge.image_url || "",
      image_urls: Array.isArray(challenge.image_urls) ? challenge.image_urls : [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    
    setDeletingId(id);

    try {
      console.log('=== STARTING CHALLENGE DELETION ===');
      console.log('Challenge ID to delete:', id);

      // Step 1: Check if challenge exists and belongs to user
      const { data: challengeCheck, error: challengeCheckError } = await supabase
        .from('challenges')
        .select('id, title')
        .eq('id', id)
        .eq('company_id', user.id)
        .single();

      if (challengeCheckError) {
        console.error('Error checking challenge:', challengeCheckError);
        throw new Error('Challenge not found or access denied');
      }
      console.log('Challenge found:', challengeCheck);

      // Step 2: Check for related submissions and scores
      console.log('Step 2: Checking for related submissions...');
      const { data: relatedSubmissions, error: submissionCheckError } = await supabase
        .from('submissions')
        .select('id')
        .eq('challenge_id', id);

      if (submissionCheckError) {
        console.error('Error checking submissions:', submissionCheckError);
        throw new Error('Failed to check related submissions');
      }
      console.log('Found submissions:', relatedSubmissions?.length || 0);

      // Step 3: Delete related scores first
      if (relatedSubmissions && relatedSubmissions.length > 0) {
        console.log('Step 3: Deleting related scores...');
        const submissionIds = relatedSubmissions.map(sub => sub.id);
        
        const { error: scoresDeleteError } = await supabase
          .from('scores')
          .delete()
          .in('submission_id', submissionIds);

        if (scoresDeleteError) {
          console.warn('Error deleting scores:', scoresDeleteError);
        }

        // Step 4: Delete related submissions
        console.log('Step 4: Deleting related submissions...');
        const { error: submissionDeleteError } = await supabase
          .from('submissions')
          .delete()
          .eq('challenge_id', id);

        if (submissionDeleteError) {
          console.error('Error deleting submissions:', submissionDeleteError);
          throw new Error('Failed to delete related submissions: ' + submissionDeleteError.message);
        }
        console.log('Successfully deleted', relatedSubmissions.length, 'submissions');
      }

      // Step 5: Delete rules and guidelines
      console.log('Step 5: Deleting rules and guidelines...');
      const { error: rulesDeleteError } = await supabase
        .from('rules_guidelines')
        .delete()
        .eq('challenge_id', id);

      if (rulesDeleteError) {
        console.warn('Error deleting rules:', rulesDeleteError);
      }

      // Step 6: Delete the challenge
      console.log('Step 6: Deleting challenge...');
      const { error: challengeDeleteError } = await supabase
        .from('challenges')
        .delete()
        .eq('id', id)
        .eq('company_id', user.id);

      if (challengeDeleteError) {
        console.error('Error deleting challenge:', challengeDeleteError);
        throw new Error('Failed to delete challenge: ' + challengeDeleteError.message);
      }

      console.log('=== CHALLENGE DELETION SUCCESSFUL ===');
      toast({ 
        title: "Success", 
        description: "Challenge and related data deleted successfully" 
      });

      fetchChallenges();
    } catch (error: any) {
      console.error('=== CHALLENGE DELETION FAILED ===');
      console.error('Error details:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete challenge",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-red-500';
      case 'draft': return 'bg-yellow-500';
      case 'judging': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="text-center">Loading challenges...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>My Challenges</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Create Challenge
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingChallenge ? 'Edit Challenge' : 'Create New Challenge'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="problem_statement">Problem Statement</Label>
                  <Textarea
                    id="problem_statement"
                    value={formData.problem_statement}
                    onChange={(e) => setFormData({...formData, problem_statement: e.target.value})}
                    placeholder="Describe the specific problem participants need to solve..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="prize_amount">Prize Amount ($)</Label>
                    <Input
                      id="prize_amount"
                      type="number"
                      value={formData.prize_amount}
                      onChange={(e) => setFormData({...formData, prize_amount: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="submission_deadline">Submission Deadline</Label>
                    <Input
                      id="submission_deadline"
                      type="datetime-local"
                      value={formData.submission_deadline}
                      onChange={(e) => setFormData({...formData, submission_deadline: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="domains">Domains (comma-separated)</Label>
                  <Input
                    id="domains"
                    value={formData.domains}
                    onChange={(e) => setFormData({...formData, domains: e.target.value})}
                    placeholder="AI, Machine Learning, Computer Vision"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value as any})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="judging">Judging</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="challenge_type">Challenge Type</Label>
                    <Select value={formData.challenge_type} onValueChange={(value) => setFormData({...formData, challenge_type: value as any})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select challenge type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="hackathon">Hackathon</SelectItem>
                        <SelectItem value="competition">Competition</SelectItem>
                        <SelectItem value="bounty">Bounty</SelectItem>
                        <SelectItem value="research">Research</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="difficulty_level">Difficulty Level</Label>
                    <Select value={formData.difficulty_level} onValueChange={(value) => setFormData({...formData, difficulty_level: value as any})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Required Deliverables</Label>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Label htmlFor="deliverables_repository">Repository Requirements</Label>
                      <Input
                        id="deliverables_repository"
                        value={formData.deliverables_repository}
                        onChange={(e) => setFormData({...formData, deliverables_repository: e.target.value})}
                        placeholder="Complete source code with training scripts"
                      />
                    </div>
                    <div>
                      <Label htmlFor="deliverables_pitch_deck">Pitch Deck Requirements</Label>
                      <Input
                        id="deliverables_pitch_deck"
                        value={formData.deliverables_pitch_deck}
                        onChange={(e) => setFormData({...formData, deliverables_pitch_deck: e.target.value})}
                        placeholder="5-10 slide presentation"
                      />
                    </div>
                    <div>
                      <Label htmlFor="deliverables_demo_video">Demo Video Requirements</Label>
                      <Input
                        id="deliverables_demo_video"
                        value={formData.deliverables_demo_video}
                        onChange={(e) => setFormData({...formData, deliverables_demo_video: e.target.value})}
                        placeholder="3-5 minute demonstration"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Evaluation Criteria (percentages)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="evaluation_technical">Technical Implementation (%)</Label>
                      <Input
                        id="evaluation_technical"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.evaluation_technical}
                        onChange={(e) => setFormData({...formData, evaluation_technical: e.target.value})}
                        placeholder="40"
                      />
                    </div>
                    <div>
                      <Label htmlFor="evaluation_innovation">Innovation (%)</Label>
                      <Input
                        id="evaluation_innovation"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.evaluation_innovation}
                        onChange={(e) => setFormData({...formData, evaluation_innovation: e.target.value})}
                        placeholder="25"
                      />
                    </div>
                    <div>
                      <Label htmlFor="evaluation_presentation">Presentation (%)</Label>
                      <Input
                        id="evaluation_presentation"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.evaluation_presentation}
                        onChange={(e) => setFormData({...formData, evaluation_presentation: e.target.value})}
                        placeholder="20"
                      />
                    </div>
                    <div>
                      <Label htmlFor="evaluation_practicality">Practicality (%)</Label>
                      <Input
                        id="evaluation_practicality"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.evaluation_practicality}
                        onChange={(e) => setFormData({...formData, evaluation_practicality: e.target.value})}
                        placeholder="15"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="primary_image">Challenge Image</Label>
                  <Input
                    id="primary_image"
                    type="file"
                    accept="image/*"
                    onChange={handlePrimaryImageChange}
                    disabled={uploadingImage}
                  />
                  {formData.image_url && (
                    <div className="mt-2">
                      <img 
                        src={formData.image_url} 
                        alt="Challenge" 
                        className="w-32 h-32 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Saving..." : editingChallenge ? "Update Challenge" : "Create Challenge"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {challenges.map((challenge) => (
            <div key={challenge.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{challenge.title}</h3>
                    <Badge className={getStatusColor(challenge.status || 'active')}>
                      {challenge.status || 'active'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{challenge.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Company: {challenge.company_name || 'N/A'}</span>
                    <span>Prize: ${challenge.prize_amount || 'TBD'}</span>
                    <span>Deadline: {new Date(challenge.submission_deadline).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(challenge)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={deletingId === challenge.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Challenge</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{challenge.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(challenge.id)}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={deletingId === challenge.id}
                        >
                          {deletingId === challenge.id ? 'Deleting...' : 'Delete Challenge'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
