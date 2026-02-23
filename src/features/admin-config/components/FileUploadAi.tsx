import { useState, useCallback } from "react";
import { Upload, FileText, X, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileProcessed: (fileName: string) => void;
  onCancel: () => void;
  acceptedFormats?: string;
  maxSizeMB?: number;
}

export function FileUpload({
  onFileProcessed,
  onCancel,
  acceptedFormats = ".pdf,.png,.jpg,.jpeg,.gif,.webp",
  maxSizeMB = 10,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) return `File size exceeds ${maxSizeMB}MB`;

    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!acceptedFormats.split(",").some((fmt) => fmt.toLowerCase() === extension))
      return "Unsupported file format";

    return null;
  };

  const handleFile = useCallback(
    (file: File) => {
      const error = validateFile(file);
      if (error) {
        setValidationError(error);
        setSelectedFile(null);
        return;
      }
      setValidationError(null);
      setSelectedFile(file);
    },
    [acceptedFormats, maxSizeMB]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setValidationError(null);
    setProgress(0);
    setProcessing(false);
  };

  const handleProcess = () => {
    if (!selectedFile) return;
    setProcessing(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => onFileProcessed(selectedFile.name), 300);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 200);
  };

  const formatFileSize = (bytes: number) =>
    bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

  // **Processing UI**
  if (processing) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center gap-3">
          <div className="relative">
            <Sparkles className="w-8 h-8 text-amber-500 animate-pulse-subtle" />
            <div className="absolute inset-0 w-8 h-8 bg-amber-500/20 rounded-full animate-ping" />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-foreground">
              AI is analyzing document structure...
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Detecting fields and data types
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Progress value={Math.min(progress, 100)} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {Math.min(Math.round(progress), 100)}% complete
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 p-3 bg-muted/50 rounded-lg">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{selectedFile?.name}</span>
        </div>
      </div>
    );
  }

  return (
    <>
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-6">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 transition-all duration-200 text-center cursor-pointer",
            isDragging
              ? "border-primary bg-primary/10"
              : "border-border/50 hover:border-primary/50 hover:bg-muted/30",
            validationError && "border-destructive/50 bg-destructive/5",
            selectedFile && "border-success bg-success/5"
          )}
        >
          <input
            type="file"
            accept={acceptedFormats}
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {!selectedFile ? (
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground">
                {isDragging ? "Drop your file here" : "Drop a file or click to browse"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Supports PDF and image files
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-success" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground truncate max-w-[200px]">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
                className="ml-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {validationError && (
          <p className="mt-4 text-destructive text-sm flex items-center gap-2">
            <X className="w-4 h-4" />
            {validationError}
          </p>
        )}
      </CardContent>
    </Card>
    {!validationError && (
      <div className="flex justify-end gap-3 mt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          onClick={handleProcess}
          disabled={!selectedFile}
          className="bg-gradient-to-r from-amber-500 to-purple-500 text-white hover:from-amber-600 hover:to-purple-600"
        >
          <Sparkles className="w-4 h-4 mr-2" /> Analyze with AI
        </Button>
      </div>
    )}
    </>
  );
}
