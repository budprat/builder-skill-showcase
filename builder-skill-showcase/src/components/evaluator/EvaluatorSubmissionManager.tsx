import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Eye, FileText, Github, Play, Gavel, Star, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Submission = Tables<"submissions">;
type Challenge = Tables<"challenges">;
type Profile = Tables<"profiles">;
type Score = Tables<"scores">;

interface SubmissionWithDetails extends Submission {
  challenges?: Challenge;
  profiles?: Profile;
  scores?: Score[];
}

const EvaluatorSubmissionManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  console.log('=== EVALUATOR SUBMISSION MANAGER RENDERED ===');
  console.log('Component mounted, user:', user?.id);
  const [evaluating, setEvaluating] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithDetails | null>(null);
  const [isScoreDialogOpen, setIsScoreDialogOpen] = useState(false);
  const [scoreData, setScoreData] = useState({
    technical_implementation: 0,
    innovation: 0,
    presentation: 0,
    practicality: 0,
    feedback: "",
  });

  useEffect(() => {
    if (user) {
      fetchSubmissions();
    }
  }, [user]);

  const fetchSubmissions = async () => {
    console.log('=== FETCH SUBMISSIONS CALLED ===');
    console.log('User exists:', !!user);
    console.log('User ID:', user?.id);

    if (!user) {
      console.log('No user found, skipping fetch');
      return;
    }

    console.log('=== FETCHING SUBMISSIONS FOR EVALUATOR ===');
    console.log('User ID:', user.id);
    console.log('User Email:', user.email);

    setLoading(true);
    try {
      // First, check user role in database
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      console.log('User roles from database:', { roleData, roleError });

      // Check if we can access submissions at all (no filter)
      const { data: allSubmissions, error: allError } = await supabase
        .from('submissions')
        .select('id, status, created_at, participant_id')
        .order('created_at', { ascending: false });

      console.log('=== ALL SUBMISSIONS CHECK ===');
      console.log('Count:', allSubmissions?.length || 0);
      console.log('Error:', allError);
      console.log('Sample submissions:', allSubmissions?.slice(0, 3));

      // Check submissions by status
      if (allSubmissions && allSubmissions.length > 0) {
        const statusCounts = allSubmissions.reduce((acc, sub) => {
          acc[sub.status] = (acc[sub.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        console.log('Status breakdown:', statusCounts);
      }

      // Now try to fetch reviewed submissions specifically
      console.log('=== FETCHING REVIEWED SUBMISSIONS ===');
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          challenges (
            id,
            title,
            company_name,
            evaluation_rubric,
            domains
          ),
          profiles (
            id,
            full_name,
            username
          ),
          scores (
            id,
            evaluator_id,
            total_score,
            technical_implementation,
            innovation,
            presentation,
            practicality,
            feedback,
            status,
            created_at
          )
        `)
        .eq('status', 'reviewed')
        .order('created_at', { ascending: false });

      console.log('=== REVIEWED SUBMISSIONS RESULT ===');
      console.log('Data:', data);
      console.log('Error:', error);
      console.log('Count:', data?.length || 0);
      console.log('User ID:', user.id);

      if (error) {
        console.error('=== SUPABASE ERROR DETAILS ===');
        console.error('Error object:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        throw error;
      }

      setSubmissions(data || []);
      console.log('=== SUBMISSIONS SET SUCCESSFULLY ===');
      console.log('Final submissions count:', data?.length || 0);

      if (data && data.length > 0) {
        console.log('Sample submission:', data[0]);
        if (data[0].scores && data[0].scores.length > 0) {
          console.log('Sample score data:', data[0].scores[0]);
          console.log('Score keys:', Object.keys(data[0].scores[0]));
          console.log('Has llm_scores:', !!data[0].scores[0].llm_scores);
          console.log('Has pre_screening_score:', data[0].scores[0].pre_screening_score);
        }
      } else {
        console.log('No reviewed submissions found for evaluator');
      }
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

  const openScoreDialog = (submission: SubmissionWithDetails) => {
    setSelectedSubmission(submission);

    // Check if user has already scored this submission
    const existingScore = submission.scores?.find(score => score.evaluator_id === user?.id);
    if (existingScore) {
      setScoreData({
        technical_implementation: existingScore.technical_implementation || 0,
        innovation: existingScore.innovation || 0,
        presentation: existingScore.presentation || 0,
        practicality: existingScore.practicality || 0,
        feedback: "",
      });
    } else {
      setScoreData({
        technical_implementation: 0,
        innovation: 0,
        presentation: 0,
        practicality: 0,
        feedback: "",
      });
    }

    setIsScoreDialogOpen(true);
  };

  const submitEvaluation = async () => {
    if (!user || !selectedSubmission) return;

    setEvaluating(true);
    try {
      const totalScore = 
        scoreData.technical_implementation + 
        scoreData.innovation + 
        scoreData.presentation + 
        scoreData.practicality;

      const scorePayload = {
        submission_id: selectedSubmission.id,
        evaluator_id: user.id,
        total_score: totalScore,
        technical_implementation: scoreData.technical_implementation,
        innovation: scoreData.innovation,
        presentation: scoreData.presentation,
        practicality: scoreData.practicality,
        feedback: scoreData.feedback,
        status: 'completed',
      };

      // Check if score already exists
      const existingScore = selectedSubmission.scores?.find(score => score.evaluator_id === user.id);

      if (existingScore) {
        // Update existing score
        const { error } = await supabase
          .from('scores')
          .update(scorePayload)
          .eq('id', existingScore.id);

        if (error) throw error;
      } else {
        // Insert new score
        const { error } = await supabase
          .from('scores')
          .insert([scorePayload]);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Evaluation submitted successfully",
      });

      setIsScoreDialogOpen(false);
      setSelectedSubmission(null);
      await fetchSubmissions();
    } catch (error: any) {
      console.error('Error submitting evaluation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit evaluation",
        variant: "destructive",
      });
    } finally {
      setEvaluating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'under_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUserEvaluationStatus = (submission: SubmissionWithDetails) => {
    const userScore = submission.scores?.find(score => score.evaluator_id === user?.id);
    return userScore ? 'evaluated' : 'pending';
  };

  if (loading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-gray-600">Loading submissions...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-gray-900 text-2xl flex items-center gap-2">
              <Gavel className="h-6 w-6" />
              Reviewed Submissions to Evaluate
            </CardTitle>
            <CardDescription>
              Score participant submissions that have been reviewed
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              const dashboardTab = document.querySelector('[value="score-dashboard"]') as HTMLElement;
              dashboardTab?.click();
            }}
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            View Score Analytics
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">No submissions to evaluate</p>
            <p className="text-gray-500 text-sm mt-2">Check back later for new submissions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => {
              const evaluationStatus = getUserEvaluationStatus(submission);
              const userScore = submission.scores?.find(score => score.evaluator_id === user?.id);
              const allScores = submission.scores || [];

              return (
                <div key={submission.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {submission.challenges?.title || 'Unknown Challenge'}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span>
                          <strong>Participant:</strong> {submission.profiles?.full_name || submission.profiles?.username || 'Unknown'}
                        </span>
                        <span>
                          <strong>Submitted:</strong> {new Date(submission.created_at || '').toLocaleDateString()}
                        </span>
                        <Badge 
                          className={`${
                            evaluationStatus === 'evaluated' 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          }`}
                        >
                          {evaluationStatus === 'evaluated' ? 'Evaluated' : 'Pending Evaluation'}
                        </Badge>
                      </div>

                      {/* Score Report Display - Only show human evaluator scores */}
                      {submission.scores && submission.scores.filter(score => !score.llm_scores).length > 0 && (
                        <div className="mt-3 p-3 bg-purple-50 rounded border border-purple-200">
                          <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            Current Evaluation Scores
                          </h4>
                          {submission.scores.filter(score => !score.llm_scores).map((score: any) => (
                            <div key={score.id} className="mb-3 last:mb-0">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-purple-700">
                                  Evaluator: {score.evaluator_id === user?.id ? 'You' : score.evaluator_id?.substring(0, 8) + '...'}
                                </span>
                                <span className="text-lg font-bold text-purple-600">
                                  {score.total_score}/100
                                </span>
                              </div>
                              <div className="grid grid-cols-4 gap-2 text-xs">
                                <div className="text-center p-2 bg-white rounded border">
                                  <div className="font-bold text-blue-600">{score.technical_implementation || 0}/25</div>
                                  <div className="text-blue-700">Technical</div>
                                </div>
                                <div className="text-center p-2 bg-white rounded border">
                                  <div className="font-bold text-green-600">{score.innovation || 0}/25</div>
                                  <div className="text-green-700">Innovation</div>
                                </div>
                                <div className="text-center p-2 bg-white rounded border">
                                  <div className="font-bold text-yellow-600">{score.presentation || 0}/25</div>
                                  <div className="text-yellow-700">Presentation</div>
                                </div>
                                <div className="text-center p-2 bg-white rounded border">
                                  <div className="font-bold text-orange-600">{score.practicality || 0}/25</div>
                                  <div className="text-orange-700">Practicality</div>
                                </div>
                              </div>
                              {score.feedback && (
                                <div className="mt-2 p-2 bg-white rounded border text-sm">
                                  <strong className="text-purple-900">Feedback:</strong>
                                  <p className="text-gray-700 mt-1">{score.feedback}</p>
                                </div>
                              )}
                              <div className="mt-1 text-xs text-purple-600">
                                Evaluated on: {new Date(score.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* AI Score Report */}
                      {submission.scores && submission.scores.length > 0 && submission.scores.find(score => score.llm_scores || score.pre_screening_score !== undefined) && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-purple-600" />
                            AI Score Report
                          </h4>

                          {/* Find the AI score entry */}
                          {(() => {
                            const aiScore = submission.scores.find(score => score.llm_scores || score.pre_screening_score !== undefined);
                            if (!aiScore) return null;
                            
                            return (
                            <>
                                {/* Overall Score Display */}
                                <div className="flex items-center justify-between mb-4 p-3 bg-white rounded-lg border">
                                  <div>
                                    <div className="text-sm text-gray-600">Overall AI Score</div>
                                    <div className="text-2xl font-bold text-purple-600">
                                      {parseFloat(aiScore.total_score || '0').toFixed(1)}/100
                                    </div>
                                  </div>
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    {aiScore.status || 'completed'}
                                  </Badge>
                                </div>

                                {/* Repository Analysis */}
                                {aiScore.pre_screening_score !== undefined && (
                                  <div className="mb-4 p-3 bg-white rounded border">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="font-medium text-sm">Repository Validation</span>
                                      <span className="font-bold text-lg">{aiScore.pre_screening_score || 0}/5</span>
                                    </div>
                                    <p className="text-xs text-gray-600">
                                      {(aiScore.pre_screening_score || 0) === 5 
                                        ? "✅ Repository exists and contains README.md" 
                                        : "❌ Repository validation failed - missing repository or README.md"}
                                    </p>
                                  </div>
                                )}

                                {/* Detailed LLM Scores */}
                                {aiScore.llm_scores && (
                                  <div className="space-y-3 mb-4">
                                    <h5 className="font-medium text-gray-900">Detailed AI Evaluation</h5>
                                    {Object.entries(aiScore.llm_scores).map(([criterion, scoreData]: [string, any]) => (
                                      <div key={criterion} className="bg-white p-3 rounded border">
                                        <div className="flex justify-between items-center mb-2">
                                          <span className="font-medium text-sm text-gray-900">
                                            {criterion.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                          </span>
                                          <Badge className="bg-green-100 text-green-800 border-green-200">
                                            {scoreData.score?.toFixed(1) || '0'}/20
                                          </Badge>
                                        </div>
                                        {scoreData.explanation && (
                                          <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded">
                                            {scoreData.explanation}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* AI Feedback */}
                                {aiScore.feedback && (
                                  <div className="mt-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <FileText className="h-4 w-4 text-amber-600" />
                                      <span className="font-medium text-sm text-amber-800">AI Generated Feedback</span>
                                    </div>
                                    <div className="bg-white p-3 rounded border border-amber-100">
                                      <p className="text-sm text-gray-700 leading-relaxed">{aiScore.feedback}</p>
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      <Button
                        onClick={() => openScoreDialog(submission)}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Star className="h-4 w-4 mr-1" />
                        {evaluationStatus === 'evaluated' ? 'Update Score' : 'Evaluate'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Evaluation Dialog */}
        <Dialog open={isScoreDialogOpen} onOpenChange={setIsScoreDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-gray-900">
                Evaluate Submission: {selectedSubmission?.challenges?.title}
              </DialogTitle>
              <DialogDescription>
                Score each criterion out of 25 points (Total: 100 points)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="technical" className="text-gray-900">Technical Implementation (0-25)</Label>
                  <Input
                    id="technical"
                    type="number"
                    min="0"
                    max="25"
                    value={scoreData.technical_implementation}
                    onChange={(e) => setScoreData({...scoreData, technical_implementation: parseInt(e.target.value) || 0})}
                    className="mt-1 border-gray-300 text-gray-900"
                  />
                </div>

                <div>
                  <Label htmlFor="innovation" className="text-gray-900">Innovation & Creativity (0-25)</Label>
                  <Input
                    id="innovation"
                    type="number"
                    min="0"
                    max="25"
                    value={scoreData.innovation}
                    onChange={(e) => setScoreData({...scoreData, innovation: parseInt(e.target.value) || 0})}
                    className="mt-1 border-gray-300 text-gray-900"
                  />
                </div>

                <div>
                  <Label htmlFor="presentation" className="text-gray-900">Presentation Quality (0-25)</Label>
                  <Input
                    id="presentation"
                    type="number"
                    min="0"
                    max="25"
                    value={scoreData.presentation}
                    onChange={(e) => setScoreData({...scoreData, presentation: parseInt(e.target.value) || 0})}
                    className="mt-1 border-gray-300 text-gray-900"
                  />
                </div>

                <div>
                  <Label htmlFor="practicality" className="text-gray-900">Practicality & Impact (0-25)</Label>
                  <Input
                    id="practicality"
                    type="number"
                    min="0"
                    max="25"
                    value={scoreData.practicality}
                    onChange={(e) => setScoreData({...scoreData, practicality: parseInt(e.target.value) || 0})}
                    className="mt-1 border-gray-300 text-gray-900"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-900 font-semibold">
                  Total Score: {scoreData.technical_implementation + scoreData.innovation + scoreData.presentation + scoreData.practicality}/100
                </Label>
              </div>

              <div>
                <Label htmlFor="feedback" className="text-gray-900">Detailed Feedback</Label>
                <Textarea
                  id="feedback"
                  value={scoreData.feedback}
                  onChange={(e) => setScoreData({...scoreData, feedback: e.target.value})}
                  placeholder="Provide detailed feedback on the submission..."
                  rows={6}
                  className="mt-1 border-gray-300 text-gray-900"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsScoreDialogOpen(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={submitEvaluation} 
                  disabled={evaluating}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {evaluating ? "Submitting..." : "Submit Evaluation"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default EvaluatorSubmissionManager;