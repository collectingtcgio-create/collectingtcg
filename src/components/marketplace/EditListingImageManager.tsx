import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface EditListingImageManagerProps {
    images: string[];
    onChange: (images: string[]) => void;
}

export function EditListingImageManager({ images, onChange }: EditListingImageManagerProps) {
    const { profile } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !profile?.id) return;

        const MAX_IMAGES = 10;
        const remainingSlots = MAX_IMAGES - images.length;
        const filesToProcess = Array.from(files).slice(0, remainingSlots);

        if (filesToProcess.length === 0) return;

        setIsUploading(true);

        try {
            // Upload all files to Supabase storage
            const uploadPromises = filesToProcess
                .filter(file => file.type.startsWith("image/"))
                .map(async (file, index) => {
                    // Generate unique filename
                    const fileExt = file.name.split(".").pop();
                    const fileName = `${profile.id}-${Date.now()}-${index}.${fileExt}`;
                    const filePath = `marketplace/${fileName}`;

                    // Upload to Supabase Storage
                    const { error: uploadError } = await supabase.storage
                        .from("card-images")
                        .upload(filePath, file, {
                            cacheControl: "3600",
                            upsert: false,
                        });

                    if (uploadError) throw uploadError;

                    // Get public URL
                    const { data: urlData } = supabase.storage
                        .from("card-images")
                        .getPublicUrl(filePath);

                    return urlData.publicUrl;
                });

            const newImageUrls = await Promise.all(uploadPromises);
            onChange([...images, ...newImageUrls]);
        } catch (error) {
            console.error('Error uploading images:', error);
        }

        setIsUploading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        onChange(newImages);
    };

    return (
        <div className="space-y-3 bg-secondary/10 p-4 rounded-xl border border-secondary/20 my-4">
            <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Listing Images</Label>
                <span className="text-xs text-muted-foreground">{images.length} / 10 images</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {images.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border group bg-background">
                        <img src={img} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="bg-destructive text-destructive-foreground rounded-full p-1.5 hover:bg-destructive/80 transition-colors"
                                title="Remove image"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        {index === 0 && (
                            <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                                MAIN
                            </div>
                        )}
                    </div>
                ))}

                {images.length < 10 && (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-lg border-2 border-dashed border-primary/50 hover:border-primary bg-primary/5 flex flex-col items-center justify-center gap-2 text-primary hover:text-primary transition-all duration-200 group"
                        title="Add image"
                    >
                        {isUploading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-medium">Add Photo</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
            />

            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full border-dashed"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={images.length >= 10 || isUploading}
                >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Images
                </Button>
            </div>
        </div>
    );
}
