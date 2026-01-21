"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Camera, Upload, X, ImageIcon, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImageUploadProps {
  value?: string | null;
  onChange: (file: File | null) => void;
  onDelete?: () => void;
  className?: string;
  aspectRatio?: number; // width/height ratio, e.g., 1 for square
  maxSize?: number; // max file size in bytes
  acceptedTypes?: string[];
  disabled?: boolean;
}

// Target dimensions for the captured/uploaded image
const TARGET_WIDTH = 400;
const TARGET_HEIGHT = 400;

export function ImageUpload({
  value,
  onChange,
  onDelete,
  className,
  aspectRatio = 1,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
  disabled = false,
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(value ?? null);
  const [isDragging, setIsDragging] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Update preview when value prop changes
  useEffect(() => {
    setPreviewUrl(value ?? null);
  }, [value]);

  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return "Invalid file type. Please upload an image.";
    }
    if (file.size > maxSize) {
      return `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`;
    }
    return null;
  }, [acceptedTypes, maxSize]);

  const handleFile = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      alert(error);
      return;
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onChange(file);
  }, [validateFile, onChange]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleFile(file);
    }
  }, [disabled, handleFile]);

  const handleDelete = useCallback(() => {
    setPreviewUrl(null);
    onChange(null);
    onDelete?.();
  }, [onChange, onDelete]);

  // Webcam functions
  const startWebcam = useCallback(async () => {
    try {
      setWebcamError(null);
      
      // Stop any existing stream
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: TARGET_WIDTH * 2 },
          height: { ideal: TARGET_HEIGHT * 2 },
        },
        audio: false,
      });

      setWebcamStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Failed to access webcam:", err);
      setWebcamError("Could not access camera. Please check permissions.");
    }
  }, [webcamStream]);

  const stopWebcam = useCallback(() => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
  }, [webcamStream]);


  const openWebcam = useCallback(() => {
    setShowWebcam(true);
    // Webcam will start when dialog opens
  }, []);

  const closeWebcam = useCallback(() => {
    stopWebcam();
    setShowWebcam(false);
    setWebcamError(null);
  }, [stopWebcam]);

  // Start webcam when dialog opens
  useEffect(() => {
    if (showWebcam) {
      startWebcam();
    }
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showWebcam]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Set canvas to target dimensions
    canvas.width = TARGET_WIDTH;
    canvas.height = TARGET_HEIGHT;

    // Calculate crop area to get center square from video
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    // Calculate the crop dimensions based on aspect ratio
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = videoWidth;
    let sourceHeight = videoHeight;
    
    const targetAspect = aspectRatio;
    const videoAspect = videoWidth / videoHeight;

    if (videoAspect > targetAspect) {
      // Video is wider than target, crop horizontally
      sourceWidth = videoHeight * targetAspect;
      sourceX = (videoWidth - sourceWidth) / 2;
    } else {
      // Video is taller than target, crop vertically
      sourceHeight = videoWidth / targetAspect;
      sourceY = (videoHeight - sourceHeight) / 2;
    }

    // Draw cropped and scaled image
    ctx.drawImage(
      video,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, TARGET_WIDTH, TARGET_HEIGHT
    );

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `webcam-${Date.now()}.jpg`, { type: "image/jpeg" });
        handleFile(file);
        closeWebcam();
      }
    }, "image/jpeg", 0.9);
  }, [aspectRatio, handleFile, closeWebcam]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Preview or Upload Area */}
      {previewUrl ? (
        <div className="relative group">
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-border bg-muted">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-8 w-8"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-8 w-8"
                onClick={handleDelete}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-6 transition-colors",
            isDragging 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="p-3 rounded-full bg-muted">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Drag & drop an image here
              </p>
              <p className="text-xs text-muted-foreground/70">
                or use the buttons below
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <Upload className="h-4 w-4 mr-2" />
          Choose Photo
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={openWebcam}
          disabled={disabled}
        >
          <Camera className="h-4 w-4 mr-2" />
          Take Photo
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Webcam Dialog */}
      <Dialog open={showWebcam} onOpenChange={(open) => !open && closeWebcam()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Take a Photo</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {webcamError ? (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="p-3 rounded-full bg-destructive/10">
                  <Camera className="h-8 w-8 text-destructive" />
                </div>
                <p className="text-sm text-destructive">{webcamError}</p>
                <Button onClick={startWebcam} variant="outline" size="sm">
                  Try Again
                </Button>
              </div>
            ) : (
              <>
                {/* Video preview with crop overlay */}
                <div className="relative mx-auto" style={{ width: TARGET_WIDTH, maxWidth: "100%" }}>
                  <div 
                    className="relative overflow-hidden rounded-lg bg-black"
                    style={{ aspectRatio: `${aspectRatio}` }}
                  >
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {/* Crop boundary overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Corner markers */}
                      <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-white/80" />
                      <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-white/80" />
                      <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-white/80" />
                      <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-white/80" />
                      {/* Center crosshair */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="w-8 h-[2px] bg-white/50" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[2px] h-8 bg-white/50" />
                      </div>
                    </div>
                    {/* Dimension indicator */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/60 rounded text-xs text-white/80">
                      {TARGET_WIDTH} × {TARGET_HEIGHT}px
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-3">
                  <Button
                    type="button"
                    onClick={capturePhoto}
                    className="bg-[#FF7D4E] hover:bg-[#FF7D4E]/90 text-white"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Capture
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
