import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  currentAvatar?: string;
  username: string;
  isLive?: boolean;
  onUploadComplete?: (url: string) => void;
}

export function AvatarUpload({ 
  currentAvatar, 
  username, 
  isLive,
  onUploadComplete 
}: AvatarUploadProps) {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("card-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("card-images")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update profile with new avatar URL
      await updateProfile({ avatar_url: publicUrl });

      toast({
        title: "Avatar updated!",
        description: "Your profile picture has been updated.",
      });

      onUploadComplete?.(publicUrl);
      setPreviewUrl(null);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const displayAvatar = previewUrl || currentAvatar;

  return (
    <div className="relative inline-block group">
      <div className={cn("relative", isLive && "live-border")}>
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-lg bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
          {displayAvatar ? (
            <img
              src={displayAvatar}
              alt={username}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-5xl font-bold text-muted-foreground">
              {username[0]?.toUpperCase()}
            </span>
          )}
          
          {/* Upload overlay */}
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading ? (
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            ) : (
              <div className="text-center">
                <Camera className="w-6 h-6 mx-auto mb-1 text-primary" />
                <span className="text-xs text-foreground">Change Photo</span>
              </div>
            )}
          </div>
        </div>
        
        {isLive && (
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-secondary text-secondary-foreground text-xs font-bold rounded-full animate-pulse">
            🔴 LIVE
          </span>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        disabled={uploading}
      />
    </div>
  );
}
