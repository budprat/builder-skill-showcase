import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, File, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  fileType: 'cv' | 'document';
  title: string;
  description: string;
  acceptedTypes?: string;
  onUploadComplete?: (url: string) => void;
}

export const FileUpload = ({ 
  fileType, 
  title, 
  description, 
  acceptedTypes = ".pdf,.doc,.docx",
  onUploadComplete 
}: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

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
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      // Validate file type
      const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
      const fileExt = file.name.split('.').pop()?.toLowerCase();

      if (!fileExt || !allowedTypes.includes('.' + fileExt)) {
        toast({
          title: "Invalid file type",
          description: "Only PDF, DOC, DOCX, JPG, and PNG files are allowed.",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      const fileName = `${user.id}/${fileType}_${Date.now()}.${fileExt}`;

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

      console.log('File uploaded successfully:', {
        fileName,
        uploadPath: uploadData.path,
        publicUrl
      });

      setUploadedFile(publicUrl);

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });

      // Call the callback with the file URL
      if (onUploadComplete) {
        onUploadComplete(publicUrl);
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{description}</p>

          {!uploadedFile ? (
            <div className="space-y-2">
              <Label htmlFor={`file-${fileType}`}>Choose file</Label>
              <Input
                id={`file-${fileType}`}
                type="file"
                accept={acceptedTypes}
                onChange={handleFileUpload}
                disabled={uploading}
              />
              {uploading && (
                <p className="text-sm text-muted-foreground">Uploading...</p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <File className="h-4 w-4" />
                <span className="text-sm">File uploaded successfully</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
```