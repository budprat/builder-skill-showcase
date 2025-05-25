
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    problem_statement: "",
    prize_amount: "",
    prize_description: "",
    submission_deadline: "",
    status: "active",
    company_name: "",
    domains: "",
  });

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
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
    
    try {
      const challengeData = {
        ...formData,
        prize_amount: formData.prize_amount ? parseInt(formData.prize_amount) : null,
        domains: formData.domains.split(',').map(d => d.trim()).filter(Boolean),
        deliverables: {},
        evaluation_rubric: {},
      };

      if (editingChallenge) {
        const { error } = await supabase
          .from('challenges')
          .update(challengeData)
          .eq('id', editingChallenge.id);

        if (error) throw error;
        toast({ title: "Success", description: "Challenge updated successfully" });
      } else {
        const { error } = await supabase
          .from('challenges')
          .insert([challengeData]);

        if (error) throw error;
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
    });
    setEditingChallenge(null);
  };

  const handleEdit = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setFormData({
      title: challenge.title,
      description: challenge.description,
      problem_statement: challenge.problem_statement,
      prize_amount: challenge.prize_amount?.toString() || "",
      prize_description: challenge.prize_description || "",
      submission_deadline: challenge.submission_deadline.split('T')[0],
      status: challenge.status || "active",
      company_name: challenge.company_name || "",
      domains: challenge.domains?.join(', ') || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this challenge?')) return;

    try {
      const { error } = await supabase
        .from('challenges')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: "Success", description: "Challenge deleted successfully" });
      fetchChallenges();
      onStatsUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete challenge",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'closed': return 'bg-red-500';
      case 'draft': return 'bg-yellow-500';
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

                <div>
                  <Label htmlFor="problem_statement">Problem Statement</Label>
                  <Textarea
                    id="problem_statement"
                    value={formData.problem_statement}
                    onChange={(e) => setFormData({...formData, problem_statement: e.target.value})}
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
                    placeholder="AI, Machine Learning, Data Science"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingChallenge ? 'Update' : 'Create'}
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
                  <Button variant="outline" size="sm" onClick={() => handleDelete(challenge.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
