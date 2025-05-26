import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, Trophy, FileText, Video, Github, ArrowLeft, Upload, X, File } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { useToast } from "@/hooks/use-toast";

interface Challenge {
  id: string;
  title: string;
  description: string;
  problem_statement: string;
  company_name: string;
  company_logo_url: string | null;
  domains: string[];
  prize_amount: number;
  prize_description: string | null;
  submission_deadline: string;
  status: string;
  deliverables: any;
  evaluation_rubric: any;
  data_pack_url: string | null;
  data_pack_description: string | null;
  created_at: string;
}

interface Submission {
  id: string;
  repository_url: string;
  pitch_deck_url: string;
  demo_video_url: string;
  readme_notes: string | null;
  status: string;
  provisional_score: number | null;
  final_score: number | null;
  created_at: string;
}

const ChallengeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);

  const [submissionForm, setSubmissionForm] = useState({
    repository_url: '',
    pitch_deck_url: '',
    demo_video_url: '',
    readme_notes: ''
  });

  const [uploadingPitchDeck, setUploadingPitchDeck] = useState(false);
  const [uploadedPitchDeck, setUploadedPitchDeck] = useState<string | null>(null);
  const [useFileUpload, setUseFileUpload] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchChallengeDetails();
    }
  }, [id, user]);

  const fetchChallengeDetails = async () => {
    if (!id) return;

    try {
      // Fetch challenge details
      const { data: challengeData, error: challengeError } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', id)
        .single();

      if (challengeError) throw challengeError;
      setChallenge(challengeData);

      // Fetch user's submission if logged in
      if (user) {
        const { data: submissionData, error: submissionError } = await supabase
          .from('submissions')
          .select(`
              *,
              scores (total_score, pre_screening_score, llm_scores, feedback, status)
            `)
          .eq('challenge_id', id)
          .eq('participant_id', user.id)
          .maybeSingle();

        if (submissionError && submissionError.code !== 'PGRST116') {
          throw submissionError;
        }

        setSubmission(submissionData);
      }
    } catch (error) {
      console.error('Error fetching challenge details:', error);
      toast({
        title: "Error",
        description: "Failed to load challenge details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePitchDeckUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingPitchDeck(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to upload files",
          variant: "destructive",
        });
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/pitch_deck_${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      if (!uploadData) {
        throw new Error('Upload failed - no data returned');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-files')
        .getPublicUrl(fileName);

      console.log('Pitch deck uploaded successfully:', {
        fileName,
        uploadPath: uploadData.path,
        publicUrl
      });

      setUploadedPitchDeck(publicUrl);
      setSubmissionForm({...submissionForm, pitch_deck_url: publicUrl});

      toast({
        title: "Success",
        description: "Pitch deck uploaded successfully",
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload pitch deck",
        variant: "destructive",
      });
    } finally {
      setUploadingPitchDeck(false);
    }
  };

  const removePitchDeck = () => {
    setUploadedPitchDeck(null);
    setSubmissionForm({...submissionForm, pitch_deck_url: ''});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !challenge) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('submissions')
        .insert({
          challenge_id: challenge.id,
          participant_id: user.id,
          repository_url: submissionForm.repository_url,
          pitch_deck_url: submissionForm.pitch_deck_url,
          demo_video_url: submissionForm.demo_video_url,
          readme_notes: submissionForm.readme_notes,
          status: 'submitted'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your submission has been received!",
      });

      // Refresh the page to show the submission
      fetchChallengeDetails();
      setShowSubmissionForm(false);
    } catch (error) {
      console.error('Error submitting:', error);
      toast({
        title: "Error",
        description: "Failed to submit. Please try again.",
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
    }).format(amount / 100);
  };

  const formatDeadline = (deadline: string) => {
    return new Date(deadline).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysLeft = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "judging":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "completed":
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <Header />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-white text-lg">Loading challenge...</div>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="text-white text-lg mb-4">Challenge not found</div>
          <Button onClick={() => navigate("/challenges")} variant="outline" className="border-white/20 text-white">
            Back to Challenges
          </Button>
        </div>
      </div>
    );
  }

  const daysLeft = getDaysLeft(challenge.submission_deadline);
  const canSubmit = user && challenge.status === 'active' && daysLeft > 0 && !submission;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <Button 
          onClick={() => navigate("/challenges")} 
          variant="ghost" 
          className="text-white hover:bg-white/10 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Challenges
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Challenge Header */}
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Badge className={getStatusColor(challenge.status)}>
                      {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
                    </Badge>
                    <CardTitle className="text-white text-3xl mb-2">{challenge.title}</CardTitle>
                    <CardDescription className="text-white/70 text-lg">
                      by {challenge.company_name}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">
                      {formatPrize(challenge.prize_amount)}
                    </div>
                    {challenge.prize_description && (
                      <div className="text-white/60">{challenge.prize_description}</div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {challenge.domains.map((domain) => (
                    <Badge key={domain} variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                      {domain}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-white/60">
                    <Calendar className="h-4 w-4 mr-2" />
                    Deadline: {formatDeadline(challenge.submission_deadline)}
                  </div>
                  <div className="flex items-center text-white/60">
                    <Clock className="h-4 w-4 mr-2" />
                    {daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Challenge Description */}
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Challenge Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-white font-semibold mb-2">Overview</h4>
                  <p className="text-white/80">{challenge.description}</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">Problem Statement</h4>
                  <p className="text-white/80">{challenge.problem_statement}</p>
                </div>
                {challenge.data_pack_url && (
                  <div>
                    <h4 className="text-white font-semibold mb-2">Data Pack</h4>
                    <p className="text-white/80 mb-2">{challenge.data_pack_description}</p>
                    <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
                      <a href={challenge.data_pack_url} target="_blank" rel="noopener noreferrer">
                        Download Data Pack
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deliverables */}
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Required Deliverables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Github className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="text-white font-medium">GitHub Repository</h4>
                      <p className="text-white/70 text-sm">Complete source code with documentation</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="text-white font-medium">Pitch Deck</h4>
                      <p className="text-white/70 text-sm">5-10 slide presentation explaining your solution</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Video className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="text-white font-medium">Demo Video</h4>
                      <p className="text-white/70 text-sm">3-5 minute demonstration of your working solution</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Submission Status */}
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Your Submission</CardTitle>
              </CardHeader>
              <CardContent>
                {submission && submission.scores ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Status:</span>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                        Submitted
                      </Badge>
                    </div>
                    <div className="text-white/70 text-sm">
                      Submitted on {new Date(submission.created_at).toLocaleDateString()}
                    </div>

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
                    
                    {submission.final_score && (
                      <div className="flex items-center justify-between">
                        <span className="text-white/70">Final Score:</span>
                        <span className="text-white font-bold">{submission.final_score}</span>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Button asChild variant="outline" size="sm" className="w-full border-white/20 text-white">
                        <a href={submission.repository_url} target="_blank" rel="noopener noreferrer">
                          View Repository
                        </a>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="w-full border-white/20 text-white">
                        <a href={submission.pitch_deck_url} target="_blank" rel="noopener noreferrer">
                          View Pitch Deck
                        </a>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="w-full border-white/20 text-white">
                        <a href={submission.demo_video_url} target="_blank" rel="noopener noreferrer">
                          Watch Demo
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : canSubmit ? (
                  <div className="space-y-4">
                    <p className="text-white/70">You haven't submitted to this challenge yet.</p>
                    <Button 
                      onClick={() => setShowSubmissionForm(true)}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      Submit Solution
                    </Button>
                  </div>
                ) : !user ? (
                  <div className="space-y-4">
                    <p className="text-white/70">Sign in to submit your solution.</p>
                    <Button 
                      onClick={() => navigate("/auth")}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600"
                    >
                      Sign In
                    </Button>
                  </div>
                ) : (
                  <div className="text-white/70">
                    {challenge.status !== 'active' ? 'Challenge is not accepting submissions' :
                     daysLeft <= 0 ? 'Submission deadline has passed' : 'You have already submitted'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Challenge Stats */}
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Challenge Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Prize Pool:</span>
                  <span className="text-white font-bold">{formatPrize(challenge.prize_amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Status:</span>
                  <Badge className={getStatusColor(challenge.status)}>
                    {challenge.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Time Left:</span>
                  <span className="text-white">{daysLeft > 0 ? `${daysLeft} days` : 'Ended'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submission Form Modal */}
        {showSubmissionForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-slate-900 border-white/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="text-white">Submit Your Solution</CardTitle>
                <CardDescription className="text-white/70">
                  All fields are required. Make sure your links are publicly accessible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      GitHub Repository URL
                    </label>
                    <Input
                      type="url"
                      required
                      value={submissionForm.repository_url}
                      onChange={(e) => setSubmissionForm({...submissionForm, repository_url: e.target.value})}
                      placeholder="https://github.com/username/project"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-white/80 text-sm font-medium">
                        Pitch Deck
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="upload-toggle" className="text-white/60 text-xs">
                          Upload file
                        </Label>
                        <input
                          id="upload-toggle"
                          type="checkbox"
                          checked={useFileUpload}
                          onChange={(e) => {
                            setUseFileUpload(e.target.checked);
                            if (!e.target.checked) {
                              setUploadedPitchDeck(null);
                              setSubmissionForm({...submissionForm, pitch_deck_url: ''});
                            }
                          }}
                          className="w-4 h-4"
                        />
                      </div>
                    </div>

                    {useFileUpload ? (
                      <div className="space-y-2">
                        {!uploadedPitchDeck ? (
                          <div className="space-y-2">
                            <Input
                              type="file"
                              accept=".pdf,.ppt,.pptx"
                              onChange={handlePitchDeckUpload}
                              disabled={uploadingPitchDeck}
                              className="bg-white/10 border-white/20 text-white file:bg-white/10 file:border-0 file:text-white/80"
                            />
                            {uploadingPitchDeck && (
                              <p className="text-sm text-white/60">Uploading...</p>
                            )}
                            <p className="text-xs text-white/60">
                              Supported formats: PDF, PPT, PPTX
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-3 border border-white/20 rounded-lg bg-white/5">
                            <div className="flex items-center gap-2">
                              <File className="h-4 w-4 text-white/60" />
                              <span className="text-sm text-white/80">Pitch deck uploaded successfully</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={removePitchDeck}
                              className="text-white/60 hover:text-white hover:bg-white/10"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Input
                        type="url"
                        required
                        value={submissionForm.pitch_deck_url}
                        onChange={(e) => setSubmissionForm({...submissionForm, pitch_deck_url: e.target.value})}
                        placeholder="https://drive.google.com/... or https://slides.google.com/..."
                        className="bg-white/10 border-white/20 text-white"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Demo Video URL
                    </label>
                    <Input
                      type="url"
                      required
                      value={submissionForm.demo_video_url}
                      onChange={(e) => setSubmissionForm({...submissionForm, demo_video_url: e.target.value})}
                      placeholder="https://youtube.com/... or https://vimeo.com/..."
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Additional Notes (Optional)
                    </label>
                    <Textarea
                      value={submissionForm.readme_notes}
                      onChange={(e) => setSubmissionForm({...submissionForm, readme_notes: e.target.value})}
                      placeholder="Any additional information about your solution..."
                      className="bg-white/10 border-white/20 text-white"
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="submit" 
                      disabled={submitting}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      {submitting ? 'Submitting...' : 'Submit Solution'}
                    </Button>
                    <Button 
                      type="button"
                      onClick={() => setShowSubmissionForm(false)}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengeDetail;