import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Check, X, RotateCw, ZoomIn } from "lucide-react";
import getCroppedImg from "@/lib/canvasUtils";

interface ImageEditorProps {
    image: string;
    onSave: (croppedImage: string) => void;
    onCancel: () => void;
}

export function ImageEditor({ image, onSave, onCancel }: ImageEditorProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [saving, setSaving] = useState(false);

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (!croppedAreaPixels) return;

        try {
            setSaving(true);
            const croppedImage = await getCroppedImg(
                image,
                croppedAreaPixels,
                rotation
            );

            if (croppedImage) {
                onSave(croppedImage);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 absolute inset-0 z-50 animate-in fade-in duration-200">
            <div className="relative flex-1 bg-black/50 overflow-hidden">
                <Cropper
                    image={image}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={3 / 4} // Standard card ratio
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                    onRotationChange={setRotation}
                    classes={{
                        containerClassName: "h-full w-full",
                        mediaClassName: "max-h-full",
                        cropAreaClassName: "neon-border-cyan shadow-[0_0_20px_rgba(0,255,255,0.3)]",
                    }}
                />
            </div>

            <div className="p-4 space-y-4 bg-background border-t border-border/50">
                <div className="space-y-4">
                    {/* Zoom Control */}
                    <div className="flex items-center gap-4">
                        <ZoomIn className="w-5 h-5 text-muted-foreground" />
                        <Slider
                            value={[zoom]}
                            min={1}
                            max={3}
                            step={0.1}
                            onValueChange={(value) => setZoom(value[0])}
                            className="flex-1"
                        />
                    </div>

                    {/* Rotation Control */}
                    <div className="flex items-center gap-4">
                        <RotateCw className="w-5 h-5 text-muted-foreground" />
                        <Slider
                            value={[rotation]}
                            min={0}
                            max={360}
                            step={1}
                            onValueChange={(value) => setRotation(value[0])}
                            className="flex-1"
                        />
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        className="flex-1 h-12 border-border hover:bg-muted"
                        disabled={saving}
                    >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold hover:neon-glow-cyan transition-all"
                        disabled={saving}
                    >
                        {saving ? (
                            "Processing..."
                        ) : (
                            <>
                                <Check className="w-4 h-4 mr-2" />
                                Done
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
