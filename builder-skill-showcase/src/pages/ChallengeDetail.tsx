import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, User, Trophy, ArrowLeft, Upload, ExternalLink, Github, Play, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/files/FileUpload";

interface Challenge {
  id: string;
  title: string;
  description: string;
  detailed_description?: string;
  company_name: string;
  domains: string[];
  prize_amount: number;
  prize_description: string;
  submission_deadline: string;
  status: string;
  created_at: string;
  requirements?: string[];
  submission_guidelines?: string;
  judging_criteria?: string[];
  problem_statement?: string;
  evaluation_rubric?: any;
  deliverables?: any;
  image_url?: string;
  image_urls?: any;
}

interface Submission {
  id: string;
  participant_id: string;
  repository_url?: string;
  pitch_deck_url?: string;
  demo_video_url?: string;
  readme_notes?: string;
  status: string;
  created_at: string;
  profiles?: {
    full_name: string;
    username: string;
  };
}

interface RuleGuideline {
  id: string;
  rule_type: string;
  title: string;
  description: string;
  is_mandatory: boolean;
  order_index: number;
}

const ChallengeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [rulesGuidelines, setRulesGuidelines] = useState<RuleGuideline[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    repository_url: "",
    pitch_deck_url: "",
    demo_video_url: "",
    readme_notes: "",
  });

  useEffect(() => {
    if (id) {
      fetchChallenge();
      fetchSubmissions();
      fetchRulesGuidelines();
    }
  }, [id, user]);

  const fetchChallenge = async () => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setChallenge(data);
    } catch (error) {
      console.error('Error fetching challenge:', error);
      toast({
        title: "Error",
        description: "Failed to load challenge details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      if (user) {
        const { data: userSubmission, error: userError } = await supabase
          .from('submissions')
          .select('*')
          .eq('challenge_id', id)
          .eq('participant_id', user.id);

        if (userError) throw userError;
        setHasSubmitted(userSubmission && userSubmission.length > 0);
      }

      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          profiles (full_name, username)
        `)
        .eq('challenge_id', id)
        .eq('status', 'submitted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const fetchRulesGuidelines = async () => {
    try {
      const { data, error } = await supabase
        .from('rules_guidelines')
        .select('*')
        .eq('challenge_id', id)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setRulesGuidelines(data || []);
    } catch (error) {
      console.error('Error fetching rules and guidelines:', error);
    }
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
          repository_url: formData.repository_url,
          pitch_deck_url: formData.pitch_deck_url,
          demo_video_url: formData.demo_video_url,
          readme_notes: formData.readme_notes,
          status: 'submitted',
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your submission has been submitted successfully!",
      });

      setIsDialogOpen(false);
      setFormData({
        repository_url: "",
        pitch_deck_url: "",
        demo_video_url: "",
        readme_notes: "",
      });

      fetchSubmissions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit your solution",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "judging":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "completed":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatPrize = (amount: number) => {
    if (!amount) return 'TBD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDeadline = (deadline: string) => {
    return new Date(deadline).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-gray-700 text-lg">Loading challenge details...</div>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Challenge not found</h1>
          <Button onClick={() => navigate("/challenges")} className="bg-blue-600 hover:bg-blue-700 text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Challenges
          </Button>
        </div>
      </div>
    );
  }

  const daysLeft = getDaysLeft(challenge.submission_deadline);
  const isExpired = daysLeft <= 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate("/challenges")}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Challenges
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Challenge Image on right side for larger screens, top for smaller screens */}
            {challenge.image_url && (
              <div className="lg:hidden mb-6">
                <img 
                  src={challenge.image_url} 
                  alt={challenge.title}
                  className="w-full h-64 object-cover rounded-lg border shadow-sm"
                  onError={(e) => {
                    console.error('Failed to load primary image:', challenge.image_url);
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                  onLoad={() => {
                    console.log('Primary image loaded successfully:', challenge.image_url);
                  }}
                />
              </div>
            )}

            {/* Challenge Description */}
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Challenge Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">{challenge.description}</p>

                {challenge.detailed_description && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Detailed Description</h4>
                    <p className="text-gray-700 leading-relaxed">{challenge.detailed_description}</p>
                  </div>
                )}

                {challenge.domains && challenge.domains.length > 0 && (
                  <div className="pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Relevant Domains</h4>
                    <div className="flex flex-wrap gap-2">
                      {challenge.domains.map((domain) => (
                        <Badge key={domain} variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                          {domain}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {challenge.requirements && challenge.requirements.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Requirements</h4>
                    <ul className="space-y-2">
                      {challenge.requirements.map((requirement, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-700">
                          <span className="text-blue-600 mt-1">•</span>
                          {requirement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {challenge.judging_criteria && challenge.judging_criteria.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Judging Criteria</h4>
                    <ul className="space-y-2">
                      {challenge.judging_criteria.map((criteria, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-700">
                          <span className="text-blue-600 mt-1">•</span>
                          {criteria}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {challenge.submission_guidelines && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Submission Guidelines</h4>
                    <p className="text-gray-700 leading-relaxed">{challenge.submission_guidelines}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Problem Statement */}
            {challenge.problem_statement && (
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Problem Statement</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{challenge.problem_statement}</p>
                </CardContent>
              </Card>
            )}

            {/* Required Deliverables */}
            {challenge.deliverables && (
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Required Deliverables</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {typeof challenge.deliverables === 'object' ? (
                      Object.entries(challenge.deliverables).map(([key, value]) => (
                        <div key={key} className="flex items-start gap-3">
                          <span className="text-blue-600 mt-1">•</span>
                          <div>
                            <h5 className="font-medium text-gray-900 capitalize">
                              {key.replace(/_/g, ' ')}
                            </h5>
                            <p className="text-gray-700 text-sm">{value as string}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-700">{challenge.deliverables}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Evaluation Criteria */}
            {challenge.evaluation_rubric && (
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Evaluation Criteria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {typeof challenge.evaluation_rubric === 'object' ? (
                      Object.entries(challenge.evaluation_rubric).map(([criterion, weight]) => (
                        <div key={criterion} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <h5 className="font-medium text-gray-900 capitalize">
                              {criterion.replace(/_/g, ' ')}
                            </h5>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-blue-600">{weight}%</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-700">{challenge.evaluation_rubric}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rules and Guidelines */}
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Rules and Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {rulesGuidelines.length > 0 ? (
                  <div className="space-y-4">
                    {rulesGuidelines.map((rule) => (
                      <div key={rule.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <div className="flex-shrink-0 mt-0.5">
                          {rule.is_mandatory ? (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{rule.title}</h4>
                          <p className="text-gray-700 text-sm">{rule.description}</p>
                          {rule.is_mandatory && (
                            <Badge variant="destructive" className="mt-2 text-xs">
                              Mandatory
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Solo/Team Participation</h4>
                        <p className="text-gray-700 text-sm">Solo participants or teams with maximum 5 members are allowed</p>
                        <Badge variant="destructive" className="mt-2 text-xs">Mandatory</Badge>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Original Work Required</h4>
                        <p className="text-gray-700 text-sm">All submissions must be original work created specifically for this challenge</p>
                        <Badge variant="destructive" className="mt-2 text-xs">Mandatory</Badge>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Code Accessibility</h4>
                        <p className="text-gray-700 text-sm">Code must be publicly accessible via GitHub or similar platform</p>
                        <Badge variant="destructive" className="mt-2 text-xs">Mandatory</Badge>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Deadline Compliance</h4>
                        <p className="text-gray-700 text-sm">All deliverables must be submitted by the specified deadline</p>
                        <Badge variant="destructive" className="mt-2 text-xs">Mandatory</Badge>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Judging Period</h4>
                        <p className="text-gray-700 text-sm">Judging period: 1-2 weeks after submission deadline</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submissions */}
            {submissions.length > 0 && (
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Community Submissions</CardTitle>
                  <CardDescription className="text-gray-600">
                    {submissions.length} submission{submissions.length !== 1 ? 's' : ''} from the community
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <div key={submission.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {submission.profiles?.full_name || 'Anonymous'}
                            </h4>
                            <p className="text-sm text-gray-600">
                              @{submission.profiles?.username || 'user'} • {new Date(submission.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {submission.readme_notes && (
                          <p className="text-gray-700 mb-3 text-sm">{submission.readme_notes}</p>
                        )}

                        <div className="space-y-2">
                          <Button asChild variant="outline" size="sm" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
                            <a href={submission.repository_url} target="_blank" rel="noopener noreferrer">
                              <Github className="w-4 h-4 mr-2" />
                              View Repository
                            </a>
                          </Button>
                          <Button asChild variant="outline" size="sm" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
                            <a href={submission.pitch_deck_url} target="_blank" rel="noopener noreferrer">
                              <FileText className="w-4 h-4 mr-2" />
                              View Pitch Deck
                            </a>
                          </Button>
                          <Button asChild variant="outline" size="sm" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
                            <a href={submission.demo_video_url} target="_blank" rel="noopener noreferrer">
                              <Play className="w-4 h-4 mr-2" />
                              Watch Demo
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Challenge Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">Deadline</div>
                    <div className="text-sm">{formatDeadline(challenge.submission_deadline)}</div>
                  </div>
                </div>

                <div className="flex items-center text-gray-600">
                  <Trophy className="h-4 w-4 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">Prize Pool</div>
                    <div className="text-sm">{formatPrize(challenge.prize_amount)}</div>
                  </div>
                </div>

                <div className="flex items-center text-gray-600">
                  <User className="h-4 w-4 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">Submissions</div>
                    <div className="text-sm">{submissions.length} submissions</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Solution */}
            {user && !isExpired && challenge.status === 'active' && (
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Submit Your Solution</CardTitle>
                  <CardDescription className="text-gray-600">
                    {hasSubmitted 
                      ? "You have already submitted a solution. You can update it from your dashboard."
                      : "Ready to showcase your AI solution?"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!hasSubmitted ? (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                          <Upload className="mr-2 h-4 w-4" />
                          Submit Solution
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-gray-200">
                        <DialogHeader>
                          <DialogTitle className="text-gray-900">Submit Your Solution</DialogTitle>
                          <DialogDescription className="text-gray-600">
                            Fill in the details about your solution. All fields are required.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div>
                            <Label htmlFor="repository_url" className="text-gray-900">Repository URL</Label>
                            <Input
                              id="repository_url"
                              value={formData.repository_url}
                              onChange={(e) => setFormData({...formData, repository_url: e.target.value})}
                              placeholder="https://github.com/username/repo"
                              required
                              className="mt-1 border-gray-300 text-gray-900"
                            />
                          </div>

                          <div>
                            <Label htmlFor="pitch_deck_url" className="text-gray-900">Pitch Deck URL</Label>
                            <Input
                              id="pitch_deck_url"
                              value={formData.pitch_deck_url}
                              onChange={(e) => setFormData({...formData, pitch_deck_url: e.target.value})}
                              placeholder="https://drive.google.com/file/d/... or upload PDF below"
                              required
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
                                setFormData({...formData, pitch_deck_url: url});
                                toast({
                                  title: "Success",
                                  description: "PDF uploaded and pitch deck URL updated",
                                });
                              }}
                            />
                          </div>

                          <div>
                            <Label htmlFor="demo_video_url" className="text-gray-900">Demo Video URL</Label>
                            <Input
                              id="demo_video_url"
                              value={formData.demo_video_url}
                              onChange={(e) => setFormData({...formData, demo_video_url: e.target.value})}
                              placeholder="https://youtube.com/watch?v=..."
                              required
                              className="mt-1 border-gray-300 text-gray-900"
                            />
                          </div>

                          <div>
                            <Label htmlFor="readme_notes" className="text-gray-900">Additional Notes</Label>
                            <Textarea
                              id="readme_notes"
                              value={formData.readme_notes}
                              onChange={(e) => setFormData({...formData, readme_notes: e.target.value})}
                              placeholder="Any additional information about your solution..."
                              rows={3}
                              className="mt-1 border-gray-300 text-gray-900"
                            />
                          </div>

                          <div className="flex justify-end space-x-2 pt-4">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setIsDialogOpen(false)}
                              className="border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={submitting}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              {submitting ? "Submitting..." : "Submit Solution"}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button 
                      onClick={() => navigate("/dashboard")}
                      variant="outline"
                      className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      View My Submission
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {!user && (
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Join the Challenge</CardTitle>
                  <CardDescription className="text-gray-600">
                    Sign in to submit your solution and compete for prizes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => navigate("/auth")}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Sign In to Participate
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeDetail;