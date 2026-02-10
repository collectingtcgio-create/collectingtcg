import { useState, useRef } from "react";
import AvatarEditor from "react-avatar-editor";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Check, X, RotateCw, ZoomIn } from "lucide-react";

interface ImageEditorProps {
    image: string;
    onSave: (croppedImage: string) => void;
    onCancel: () => void;
}

export function ImageEditor({ image, onSave, onCancel }: ImageEditorProps) {
    const editorRef = useRef<AvatarEditor>(null);
    const [scale, setScale] = useState(1);
    const [rotate, setRotate] = useState(0);
    const [saving, setSaving] = useState(false);

    const handleSave = () => {
        if (!editorRef.current) return;

        try {
            setSaving(true);
            // Get the cropped image as a canvas
            const canvas = editorRef.current.getImageScaledToCanvas();
            // Convert to base64 JPEG
            const croppedImage = canvas.toDataURL('image/jpeg', 0.92);
            onSave(croppedImage);
        } catch (e) {
            console.error("Failed to save cropped image:", e);
        } finally {
            setSaving(false);
        }
    };

    const handleRotate = () => {
        setRotate((prev) => (prev + 90) % 360);
    };

    return (
        <div className="flex flex-col h-full w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 absolute inset-0 z-50 animate-in fade-in duration-200">
            <div className="relative flex-1 bg-black/50 overflow-hidden flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-4">
                    <AvatarEditor
                        ref={editorRef}
                        image={image}
                        width={300}
                        height={400}
                        border={50}
                        borderRadius={8}
                        color={[0, 0, 0, 0.6]} // RGBA for border overlay
                        scale={scale}
                        rotate={rotate}
                        className="rounded-lg shadow-2xl"
                    />
                </div>
            </div>

            <div className="p-4 space-y-4 bg-background border-t border-border/50">
                <div className="space-y-4">
                    {/* Zoom Control */}
                    <div className="flex items-center gap-4">
                        <ZoomIn className="w-5 h-5 text-muted-foreground" />
                        <Slider
                            value={[scale]}
                            min={1}
                            max={3}
                            step={0.1}
                            onValueChange={(value) => setScale(value[0])}
                            className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground w-12 text-right">
                            {Math.round(scale * 100)}%
                        </span>
                    </div>

                    {/* Rotate Button */}
                    <div className="flex items-center justify-center">
                        <Button
                            variant="outline"
                            onClick={handleRotate}
                            className="h-10 px-6 border-border hover:bg-muted"
                            disabled={saving}
                        >
                            <RotateCw className="w-4 h-4 mr-2" />
                            Rotate 90°
                        </Button>
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
