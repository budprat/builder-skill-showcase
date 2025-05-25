
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Eye, Star, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Submission = Tables<"submissions"> & {
  challenges: { title: string };
  profiles: { full_name: string; username: string };
};

export const SubmissionManager = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isScoreDialogOpen, setIsScoreDialogOpen] = useState(false);
  const [finalScore, setFinalScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          challenges (title),
          profiles (full_name, username)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateScore = async () => {
    if (!selectedSubmission) return;

    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          final_score: parseFloat(finalScore),
          human_feedback: { feedback, updated_at: new Date().toISOString() },
        })
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Submission score updated successfully",
      });

      setIsScoreDialogOpen(false);
      setFinalScore("");
      setFeedback("");
      fetchSubmissions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update score",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-500';
      case 'reviewed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="text-center">Loading submissions...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Submission Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div key={submission.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{submission.challenges?.title}</h3>
                    <Badge className={getStatusColor(submission.status || 'submitted')}>
                      {submission.status || 'submitted'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    Participant: {submission.profiles?.full_name || submission.profiles?.username || 'Unknown'}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span>Submitted: {new Date(submission.created_at || '').toLocaleDateString()}</span>
                    {submission.provisional_score && (
                      <span>Provisional Score: {submission.provisional_score}/100</span>
                    )}
                    {submission.final_score && (
                      <span>Final Score: {submission.final_score}/100</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(submission.repository_url, '_blank')}
                    >
                      View Repository
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(submission.pitch_deck_url, '_blank')}
                    >
                      View Pitch Deck
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(submission.demo_video_url, '_blank')}
                    >
                      View Demo Video
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Dialog open={isScoreDialogOpen} onOpenChange={setIsScoreDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setFinalScore(submission.final_score?.toString() || "");
                          setFeedback(
                            typeof submission.human_feedback === 'object' && submission.human_feedback
                              ? (submission.human_feedback as any).feedback || ""
                              : ""
                          );
                        }}
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Score
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Review Submission</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="score">Final Score (0-100)</Label>
                          <Input
                            id="score"
                            type="number"
                            min="0"
                            max="100"
                            value={finalScore}
                            onChange={(e) => setFinalScore(e.target.value)}
                            placeholder="Enter score"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="feedback">Feedback</Label>
                          <textarea
                            id="feedback"
                            className="w-full p-2 border rounded-md"
                            rows={4}
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Provide detailed feedback..."
                          />
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsScoreDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={updateScore}>
                            Update Score
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
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
      </CardContent>
    </Card>
  );
};
