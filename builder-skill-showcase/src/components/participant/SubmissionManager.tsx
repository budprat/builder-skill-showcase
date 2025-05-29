import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Edit, Trash2, FileText, Github, Play, ExternalLink, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/files/FileUpload";
import type { Tables } from "@/integrations/supabase/types";

type Submission = Tables<"submissions">;
type Challenge = Tables<"challenges">;

interface SubmissionWithChallenge extends Submission {
  challenges?: Challenge;
}

const SubmissionManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<SubmissionWithChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithChallenge | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [editFormData, setEditFormData] = useState({
    repository_url: "",
    pitch_deck_url: "",
    demo_video_url: "",
    readme_notes: "",
  });

  useEffect(() => {
    if (user) {
      fetchSubmissions();
    }
  }, [user]);

  const fetchSubmissions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          challenges (
            id,
            title,
            company_name,
            submission_deadline,
            status
          )
        `)
        .eq('participant_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (submission: SubmissionWithChallenge) => {
    setSelectedSubmission(submission);
    setEditFormData({
      repository_url: submission.repository_url || "",
      pitch_deck_url: submission.pitch_deck_url || "",
      demo_video_url: submission.demo_video_url || "",
      readme_notes: submission.readme_notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedSubmission) return;

    setEditing(true);
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
        .eq('id', selectedSubmission.id)
        .eq('participant_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Submission updated successfully",
      });

      setIsEditDialogOpen(false);
      setSelectedSubmission(null);
      await fetchSubmissions();
    } catch (error: any) {
      console.error('Error updating submission:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update submission",
        variant: "destructive",
      });
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async (submissionId: string) => {
    if (!user) return;

    setDeleting(submissionId);
    try {
      // Delete related scores first
      await supabase
        .from('scores')
        .delete()
        .eq('submission_id', submissionId);

      // Delete the submission
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', submissionId)
        .eq('participant_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Submission deleted successfully",
      });

      await fetchSubmissions();
    } catch (error: any) {
      console.error('Error deleting submission:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete submission",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'under_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reviewed': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canEditOrDelete = (submission: SubmissionWithChallenge) => {
    return submission.status === 'submitted' || submission.status === 'draft';
  };

  const canDelete = (submission: SubmissionWithChallenge) => {
    return submission.status === 'reviewed';
  }

  const isExpired = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  if (loading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-gray-600">Loading your submissions...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="text-gray-900 text-2xl flex items-center gap-2">
          <FileText className="h-6 w-6" />
          My Submissions
        </CardTitle>
        <CardDescription>
          Manage your challenge submissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">No submissions yet</p>
            <p className="text-gray-500 text-sm mt-2">Submit to challenges to see them here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => {
              const canModify = canEditOrDelete(submission);
              const challengeExpired = submission.challenges ? isExpired(submission.challenges.submission_deadline) : false;

              return (
                <div key={submission.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {submission.challenges?.title || 'Unknown Challenge'}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span>
                          <strong>Company:</strong> {submission.challenges?.company_name || 'Unknown'}
                        </span>
                        <span>
                          <strong>Submitted:</strong> {new Date(submission.created_at || '').toLocaleDateString()}
                        </span>
                        <Badge className={getStatusColor(submission.status || 'unknown')}>
                          {submission.status?.charAt(0).toUpperCase() + (submission.status?.slice(1) || '')}
                        </Badge>
                      </div>

                      {submission.readme_notes && (
                        <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                          <h4 className="font-medium text-gray-900 mb-1">Notes</h4>
                          <p className="text-gray-700 text-sm">{submission.readme_notes}</p>
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                          <a href={submission.repository_url} target="_blank" rel="noopener noreferrer">
                            <Github className="w-4 h-4 mr-1" />
                            Repository
                          </a>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                          <a href={submission.pitch_deck_url} target="_blank" rel="noopener noreferrer">
                            <FileText className="w-4 h-4 mr-1" />
                            Pitch Deck
                          </a>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                          <a href={submission.demo_video_url} target="_blank" rel="noopener noreferrer">
                            <Play className="w-4 h-4 mr-1" />
                            Demo Video
                          </a>
                        </Button>
                      </div>

                      {!canEditOrDelete && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-amber-600">
                          <AlertCircle className="h-4 w-4" />
                          <span>
                            {submission.status === 'reviewed' 
                              ? 'This submission has been evaluated and cannot be edited, but can be deleted'
                              : submission.status === 'completed' 
                              ? 'This submission is completed and cannot be modified'
                              : 'This submission cannot be modified'
                            }
                          </span>
                        </div>
                      )}

                      {challengeExpired && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <span>Challenge deadline has passed</span>
                        </div>
                      )}
                    </div>

                    {!challengeExpired && (canEditOrDelete || canDelete(submission)) && (
                      <div className="ml-4 flex gap-2">
                        {canEditOrDelete && (
                          <Button
                            onClick={() => openEditDialog(submission)}
                            variant="outline"
                            size="sm"
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}

                        {canDelete(submission) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={deleting === submission.id}
                                className="border-red-300 text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Submission</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this submission? This action cannot be undone.
                                  {submission.status === 'reviewed' && (
                                    <div className="mt-2 text-amber-600 font-medium">
                                      Note: This submission has already been evaluated. Deleting it will remove the evaluation results.
                                    </div>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(submission.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-gray-900">
                Edit Submission: {selectedSubmission?.challenges?.title}
              </DialogTitle>
              <DialogDescription>
                Update your submission details. All fields are required.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <Label htmlFor="repository_url" className="text-gray-900">Repository URL</Label>
                <Input
                  id="repository_url"
                  value={editFormData.repository_url}
                  onChange={(e) => setEditFormData({...editFormData, repository_url: e.target.value})}
                  placeholder="https://github.com/username/repo"
                  required
                  className="mt-1 border-gray-300 text-gray-900"
                />
              </div>

              <div>
                <Label htmlFor="pitch_deck_url" className="text-gray-900">Pitch Deck URL</Label>
                <Input
                  id="pitch_deck_url"
                  value={editFormData.pitch_deck_url}
                  onChange={(e) => setEditFormData({...editFormData, pitch_deck_url: e.target.value})}
                  placeholder="https://drive.google.com/file/d/... or upload PDF below"
                  required
                  className="mt-1 border-gray-300 text-gray-900"
                />
              </div>

              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <Label className="text-sm font-medium mb-2 block text-gray-900">Upload New Pitch Deck PDF</Label>
                <p className="text-xs text-gray-600 mb-3">
                  Upload a PDF file directly to replace the current pitch deck
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
                <Label htmlFor="demo_video_url" className="text-gray-900">Demo Video URL</Label>
                <Input
                  id="demo_video_url"
                  value={editFormData.demo_video_url}
                  onChange={(e) => setEditFormData({...editFormData, demo_video_url: e.target.value})}
                  placeholder="https://youtube.com/watch?v=..."
                  required
                  className="mt-1 border-gray-300 text-gray-900"
                />
              </div>

              <div>
                <Label htmlFor="readme_notes" className="text-gray-900">Additional Notes</Label>
                <Textarea
                  id="readme_notes"
                  value={editFormData.readme_notes}
                  onChange={(e) => setEditFormData({...editFormData, readme_notes: e.target.value})}
                  placeholder="Any additional information about your solution..."
                  rows={3}
                  className="mt-1 border-gray-300 text-gray-900"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={editing}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {editing ? "Updating..." : "Update Submission"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default SubmissionManager;