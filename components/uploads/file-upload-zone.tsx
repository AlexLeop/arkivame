
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  File, 
  Image, 
  FileText,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface UploadedFile {
  id: string;
  originalName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  uploadedAt: string;
}

interface FileUploadZoneProps {
  onFilesUploaded?: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: Record<string, string[]>;
  className?: string;
}

export function FileUploadZone({
  onFilesUploaded,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'application/pdf': ['.pdf'],
    'text/*': ['.txt', '.md'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
  },
  className = ''
}: FileUploadZoneProps) {
  const { toast } = useToast();
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const uploadFile = useCallback(async (file: File) => {
    const fileKey = `${file.name}-${Date.now()}`;
    setUploadProgress(prev => ({ ...prev, [fileKey]: 0 }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => ({
          ...prev,
          [fileKey]: Math.min((prev[fileKey] || 0) + Math.random() * 30, 95)
        }));
      }, 200);

      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (response.ok) {
        const uploadedFile = await response.json();
        setUploadProgress(prev => ({ ...prev, [fileKey]: 100 }));
        
        setUploadedFiles(prev => [...prev, uploadedFile]);
        
        // Clear progress after a short delay
        setTimeout(() => {
          setUploadProgress(prev => {
            const { [fileKey]: removed, ...rest } = prev;
            return rest;
          });
        }, 1000);

        toast({
          title: "Upload successful",
          description: `${file.name} has been uploaded.`,
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      setUploadProgress(prev => {
        const { [fileKey]: removed, ...rest } = prev;
        return rest;
      });
      
      setErrors(prev => ({
        ...prev,
        [fileKey]: 'Upload failed'
      }));

      toast({
        title: "Upload failed",
        description: `Failed to upload ${file.name}. Please try again.`,
        variant: "destructive"
      });
    }
  }, [toast]);

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errorMessages = rejectedFiles.map((rejected) => {
        const errors = rejected.errors.map((error: any) => {
          switch (error.code) {
            case 'file-too-large':
              return `File is too large. Max size is ${formatFileSize(maxSize)}.`;
            case 'file-invalid-type':
              return 'File type is not supported.';
            default:
              return error.message;
          }
        });
        return `${rejected.file.name}: ${errors.join(', ')}`;
      });

      toast({
        title: "Upload Error",
        description: errorMessages.join('\n'),
        variant: "destructive"
      });
    }

    if (acceptedFiles.length === 0) return;

    // Check total file count
    if (uploadedFiles.length + acceptedFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed.`,
        variant: "destructive"
      });
      return;
    }

    setUploadingFiles(acceptedFiles);

    // Upload each file
    for (const file of acceptedFiles) {
      await uploadFile(file);
    }

    setUploadingFiles([]);
  }, [maxFiles, maxSize, uploadedFiles.length, toast, uploadFile]);

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" alt="" />;
    if (mimeType === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept,
    multiple: maxFiles > 1
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
      >
        <input {...getInputProps()} />
        
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        
        {isDragActive ? (
          <p className="text-primary font-medium">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-lg font-medium mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Max {maxFiles} files, up to {formatFileSize(maxSize)} each
            </p>
            <Button variant="secondary">
              Choose Files
            </Button>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {Object.entries(uploadProgress).map(([fileKey, progress]) => {
        const fileName = fileKey.split('-').slice(0, -1).join('-');
        return (
          <div key={fileKey} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{fileName}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        );
      })}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Uploaded Files</h4>
          {uploadedFiles.map((file) => (
            <div 
              key={file.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-3">
                {getFileIcon(file.mimeType)}
                <div>
                  <p className="font-medium text-sm">{file.originalName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.fileSize)}
                  </p>
                </div>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => removeFile(file.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Errors */}
      {Object.entries(errors).map(([fileKey, error]) => (
        <div key={fileKey} className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      ))}
    </div>
  );
}
