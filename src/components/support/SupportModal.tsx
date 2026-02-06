import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, MessageSquare } from "lucide-react";

interface SupportModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SupportModal({ isOpen, onOpenChange }: SupportModalProps) {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [subject, setSubject] = useState("");
    const [type, setType] = useState("other");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !profile) {
            toast({
                title: "Authentication Required",
                description: "Please sign in and ensure your profile is loaded to submit a support request.",
                variant: "destructive",
            });
            return;
        }

        if (!subject.trim() || !message.trim()) {
            toast({
                title: "Missing Information",
                description: "Please provide both a subject and a message.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            // 1. Create the case
            const { data: caseData, error: caseError } = await supabase
                .from("cases")
                .insert({
                    user_id: profile.id,
                    subject: subject.trim(),
                    type: type,
                    status: "new",
                    priority: "medium",
                })
                .select()
                .single();

            if (caseError) throw caseError;

            // 2. Create the first message in the case
            const { error: messageError } = await supabase
                .from("case_messages")
                .insert({
                    case_id: caseData.id,
                    sender_id: profile.id,
                    content: message.trim(),
                    is_internal: false,
                });

            if (messageError) throw messageError;

            toast({
                title: "Support Request Sent",
                description: `Your case #${caseData.id.slice(0, 8)} has been created. Our team will get back to you soon.`,
            });

            // Clear form and close modal
            setSubject("");
            setType("other");
            setMessage("");
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error submitting support request:", error);
            toast({
                title: "Submission Failed",
                description: error.message || "An error occurred while sending your request.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] glass-card neon-border-pink">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-primary" />
                        </div>
                        <DialogTitle className="text-xl font-bold gradient-text">Contact Support</DialogTitle>
                    </div>
                    <DialogDescription className="text-muted-foreground">
                        Have a question or issue? Fill out the form below and our team will help you out.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="type">Issue Type</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger id="type" className="bg-background/50 border-border/50">
                                <SelectValue placeholder="Select issue type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="payment">Payment Issue</SelectItem>
                                <SelectItem value="dispute">Transaction Dispute</SelectItem>
                                <SelectItem value="report">Report a User/Listing</SelectItem>
                                <SelectItem value="refund">Refund Request</SelectItem>
                                <SelectItem value="technical">Technical Problem</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                            id="subject"
                            placeholder="Briefly describe your issue"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="bg-background/50 border-border/50 focus:neon-border-cyan transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                            id="message"
                            placeholder="Tell us more about what's happening..."
                            className="min-h-[120px] bg-background/50 border-border/50 focus:neon-border-cyan transition-all"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 hover:neon-glow-pink transition-all duration-300"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                "Send Request"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
