import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, RotateCcw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface CameraViewHandle {
  captureFrame: () => string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  isActive: boolean;
}

interface CameraViewProps {
  onCapture?: (imageData: string) => void;
  isProcessing?: boolean;
}

export const CameraView = forwardRef<CameraViewHandle, CameraViewProps>(
  ({ onCapture, isProcessing = false }, ref) => {
    const { toast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [isCameraActive, setIsCameraActive] = useState(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isInitializing, setIsInitializing] = useState(false);

    const startCamera = useCallback(async () => {
      if (streamRef.current) return;
      
      setIsInitializing(true);
      try {
        // Key fix: the <video> element must exist even before activation.
        // We render it always, so videoRef.current should be available here.
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera API not supported in this browser");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });

        const videoEl = videoRef.current;
        if (!videoEl) {
          // Extremely rare now, but keep a clear error if it happens.
          throw new Error("Video element not ready");
        }

        videoEl.srcObject = stream;
        streamRef.current = stream;

        // Wait for metadata so play() reliably starts.
        await new Promise<void>((resolve) => {
          if (videoEl.readyState >= 1) return resolve();
          const handler = () => {
            videoEl.removeEventListener("loadedmetadata", handler);
            resolve();
          };
          videoEl.addEventListener("loadedmetadata", handler);
        });

        await videoEl.play();
        setIsCameraActive(true);
        setHasPermission(true);
      } catch (error: any) {
        setHasPermission(false);
        
        let description = "Please allow camera access to scan cards.";
        if (error.name === "NotAllowedError") {
          description = "Camera permission was denied. Please allow access in your browser settings.";
        } else if (error.name === "NotFoundError") {
          description = "No camera found on this device.";
        } else if (error.name === "NotReadableError") {
          description = "Camera is in use by another application.";
        } else if (error.message) {
          description = error.message;
        }
        
        toast({
          title: "Camera access failed",
          description,
          variant: "destructive",
        });
      } finally {
        setIsInitializing(false);
      }
    }, [toast]);

    const stopCamera = useCallback(() => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
    }, []);

    const captureFrame = useCallback((): string | null => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!video || !canvas || !isCameraActive) return null;

      const context = canvas.getContext("2d");
      if (!context) return null;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to base64 JPEG (smaller file size)
      const imageData = canvas.toDataURL("image/jpeg", 0.85);
      
      if (onCapture) {
        onCapture(imageData);
      }

      return imageData;
    }, [isCameraActive, onCapture]);

    // Expose methods via ref
    useImperativeHandle(
      ref,
      () => ({
        captureFrame,
        startCamera,
        stopCamera,
        isActive: isCameraActive,
      }),
      [captureFrame, startCamera, stopCamera, isCameraActive]
    );

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      };
    }, []);

    return (
      <div className="relative">
        {/* Camera View Container */}
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted">
          {/* Always-mounted video so the ref exists when Start Camera is clicked */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              isCameraActive ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Active overlays */}
          {isCameraActive && (
            <>
              {/* Viewfinder Overlay */}
              <div className="absolute inset-6 viewfinder pointer-events-none">
                {isProcessing && <div className="scan-line" />}
              </div>

              {/* Corner decorations */}
              <div className="absolute top-4 right-4">
                <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              </div>
            </>
          )}

          {/* Inactive placeholder overlay */}
          {!isCameraActive && (
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-6">
              {isInitializing ? (
                <>
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  <p className="text-muted-foreground text-sm">Initializing camera...</p>
                </>
              ) : hasPermission === false ? (
                <>
                  <CameraOff className="w-16 h-16 text-destructive mb-4" />
                  <p className="text-destructive font-medium mb-2">Camera access denied</p>
                  <p className="text-muted-foreground text-sm text-center mb-4">
                    Please allow camera access in your browser settings to scan cards.
                  </p>
                  <Button onClick={startCamera} variant="outline" className="rounded-full">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </>
              ) : (
                <>
                  <Camera className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-sm text-center mb-4">
                    Position your card within the frame
                  </p>
                  <Button
                    onClick={startCamera}
                    className="rounded-full bg-primary hover:bg-primary/80 text-primary-foreground hover:neon-glow-cyan transition-all duration-300"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-primary font-semibold">Identifying Card...</p>
                <p className="text-sm text-muted-foreground">
                  Analyzing image with AI
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Camera Controls */}
        {isCameraActive && !isProcessing && (
          <div className="mt-4 flex justify-center">
            <Button
              onClick={stopCamera}
              variant="ghost"
              size="sm"
              className="rounded-full text-muted-foreground"
            >
              <CameraOff className="w-4 h-4 mr-2" />
              Stop Camera
            </Button>
          </div>
        )}
      </div>
    );
  }
);

CameraView.displayName = "CameraView";
