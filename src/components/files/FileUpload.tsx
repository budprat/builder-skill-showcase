
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
  onFileUploaded?: (fileData: any) => void;
  acceptedTypes?: string[];
  maxSize?: number;
  label?: string;
}

export const FileUpload = ({ 
  onFileUploaded, 
  acceptedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
  maxSize = 50 * 1024 * 1024, // 50MB
  label = "Upload File"
}: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `File size must be less than ${maxSize / (1024 * 1024)}MB`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save file metadata to database
      const { data: fileRecord, error: dbError } = await supabase
        .from('user_files')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: uploadData.path,
          file_type: fileExt || 'unknown',
          file_size: file.size,
          mime_type: file.type,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setUploadedFiles(prev => [...prev, fileRecord]);
      onFileUploaded?.(fileRecord);

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });

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

  const removeFile = async (fileId: string, filePath: string) => {
    try {
      // Delete from storage
      await supabase.storage.from('user-files').remove([filePath]);
      
      // Delete from database
      await supabase.from('user_files').delete().eq('id', fileId);
      
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
      
      toast({
        title: "Success",
        description: "File removed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove file",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="file-upload">Choose file</Label>
          <Input
            id="file-upload"
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={handleFileUpload}
            disabled={uploading}
            className="mt-1"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Accepted formats: {acceptedTypes.join(', ')}. Max size: {maxSize / (1024 * 1024)}MB
          </p>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <Label>Uploaded Files</Label>
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4" />
                  <span className="text-sm">{file.file_name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.file_size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id, file.file_path)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {uploading && (
          <div className="text-center text-sm text-muted-foreground">
            Uploading...
          </div>
        )}
      </CardContent>
    </Card>
  );
};
