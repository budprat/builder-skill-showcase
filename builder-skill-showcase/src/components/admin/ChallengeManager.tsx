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
import type { Tables } from "@/integrations/supabase/types";

type Challenge = Tables<"challenges">;

interface ChallengeManagerProps {
  onStatsUpdate: () => void;
}

export const ChallengeManager = ({ onStatsUpdate }: ChallengeManagerProps) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    problem_statement: "",
    prize_amount: "",
    prize_description: "",
    submission_deadline: "",
    status: "active" as "active" | "draft" | "judging" | "completed",
    company_name: "",
    domains: "",
    deliverables_repository: "",
    deliverables_pitch_deck: "",
    deliverables_demo_video: "",
    evaluation_technical: "",
    evaluation_innovation: "",
    evaluation_presentation: "",
    evaluation_practicality: "",
  });

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      console.log('=== FETCHING CHALLENGES ===');
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched challenges count:', data?.length || 0);
      console.log('Challenge IDs:', data?.map(c => c.id) || []);
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
    setSubmitting(true);

    try {
      console.log('=== SUBMITTING CHALLENGE ===');
      console.log('Form data status:', formData.status);

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
        company_name: formData.company_name,
        domains: formData.domains.split(',').map(d => d.trim()).filter(d => d.length > 0),
        deliverables: deliverables,
        evaluation_rubric: evaluation_rubric,
      };

      console.log('Challenge data being sent:', challengeData);

      if (editingChallenge) {
        console.log('Updating challenge with ID:', editingChallenge.id);
        const { error } = await supabase
          .from('challenges')
          .update(challengeData)
          .eq('id', editingChallenge.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        toast({ title: "Success", description: "Challenge updated successfully" });
      } else {
        console.log('Creating new challenge');
        const { error } = await supabase
          .from('challenges')
          .insert([challengeData]);

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        toast({ title: "Success", description: "Challenge created successfully" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchChallenges();
      onStatsUpdate();
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

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      problem_statement: "",
      prize_amount: "",
      prize_description: "",
      submission_deadline: "",
      status: "active",
      company_name: "",
      domains: "",
      deliverables_repository: "",
      deliverables_pitch_deck: "",
      deliverables_demo_video: "",
      evaluation_technical: "",
      evaluation_innovation: "",
      evaluation_presentation: "",
      evaluation_practicality: "",
    });
    setEditingChallenge(null);
  };

  const handleEdit = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    const deliverables = challenge.deliverables || {};
    const evaluation = challenge.evaluation_rubric || {};

    setFormData({
      title: challenge.title,
      description: challenge.description,
      problem_statement: challenge.problem_statement || "",
      prize_amount: challenge.prize_amount?.toString() || "",
      prize_description: challenge.prize_description || "",
      submission_deadline: challenge.submission_deadline.split('T')[0], // Format for date input
      status: challenge.status as "active" | "draft" | "judging" | "completed",
      company_name: challenge.company_name || "",
      domains: Array.isArray(challenge.domains) ? challenge.domains.join(", ") : "",
      deliverables_repository: deliverables.repository || "",
      deliverables_pitch_deck: deliverables.pitch_deck || "",
      deliverables_demo_video: deliverables.demo_video || "",
      evaluation_technical: evaluation.technical_implementation?.toString() || "",
      evaluation_innovation: evaluation.innovation?.toString() || "",
      evaluation_presentation: evaluation.presentation?.toString() || "",
      evaluation_practicality: evaluation.practicality?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (challengeId: string) => {
    console.log('*** DELETE BUTTON CLICKED ***');
    console.log('Challenge ID from click:', challengeId);
    console.log('Current deletingId state:', deletingId);

    // Don't proceed if already deleting
    if (deletingId === challengeId) {
      console.log('Already deleting this challenge, ignoring click');
      return;
    }

    console.log('Proceeding with deletion...');
    handleDelete(challengeId);
  };

  const handleDelete = async (id: string) => {
    console.log('=== STARTING CHALLENGE DELETION ===');
    console.log('Challenge ID to delete:', id);
    console.log('Supabase client exists:', !!supabase);

    setDeletingId(id);

    try {
      // Step 1: Check current user session
      console.log('Step 1: Checking authentication...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Authentication error:', authError);
        throw new Error('You must be logged in to delete challenges');
      }
      console.log('User authenticated:', user.id);

      // Step 2: Check if challenge exists
      console.log('Step 2: Checking if challenge exists...');
      const { data: challengeCheck, error: challengeCheckError } = await supabase
        .from('challenges')
        .select('id, title')
        .eq('id', id)
        .single();

      if (challengeCheckError) {
        console.error('Error checking challenge existence:', challengeCheckError);
        throw new Error('Challenge not found or access denied');
      }
      console.log('Challenge found:', challengeCheck);

      // Step 3: Check for related submissions
      console.log('Step 3: Checking for related submissions...');
      const { data: relatedSubmissions, error: submissionCheckError } = await supabase
        .from('submissions')
        .select('id, participant_id')
        .eq('challenge_id', id);

      if (submissionCheckError) {
        console.error('Error checking submissions:', submissionCheckError);
        throw new Error('Failed to check related submissions');
      }
      console.log('Found submissions:', relatedSubmissions?.length || 0);

      // Step 4: Delete related submissions if any exist
      if (relatedSubmissions && relatedSubmissions.length > 0) {
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
      } else {
        console.log('Step 4: No submissions to delete');
      }

      // Step 5: Delete the challenge
      console.log('Step 5: Deleting challenge...');
      const { error: challengeDeleteError } = await supabase
        .from('challenges')
        .delete()
        .eq('id', id);

      if (challengeDeleteError) {
        console.error('Error deleting challenge:', challengeDeleteError);
        throw new Error('Failed to delete challenge: ' + challengeDeleteError.message);
      }

      console.log('=== CHALLENGE DELETION SUCCESSFUL ===');
      toast({ 
        title: "Success", 
        description: "Challenge and related submissions deleted successfully" 
      });

      console.log('=== REFRESHING UI ===');
      await fetchChallenges();
      console.log('=== CALLING STATS UPDATE ===');
      onStatsUpdate();
    } catch (error: any) {
      console.error('=== CHALLENGE DELETION FAILED ===');
      console.error('Error details:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete challenge. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
      console.log('Delete operation completed, clearing deletingId state');
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
          <CardTitle>Challenge Management</CardTitle>
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
                      type="date"
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
                    <Label className="text-base font-semibold">Evaluation Criteria (percentages must add up to 100)</Label>
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
                        onClick={() => console.log('AlertDialog trigger clicked for challenge:', challenge.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Challenge</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{challenge.title}"? This will also delete all related submissions and cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => console.log('Delete cancelled for challenge:', challenge.id)}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteClick(challenge.id)}
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