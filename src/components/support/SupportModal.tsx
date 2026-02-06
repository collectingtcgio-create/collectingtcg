import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Clock, ChevronRight, Inbox, Send } from "lucide-react";
import { cn } from "@/lib/utils";

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
    const [expandedCase, setExpandedCase] = useState<string | null>(null);
    const [replyMessage, setReplyMessage] = useState("");
    const [replyLoading, setReplyLoading] = useState(false);

    // Fetch user's cases
    const { data: cases, isLoading: isLoadingCases, refetch: refetchCases } = useQuery({
        queryKey: ['my-cases', profile?.id],
        queryFn: async () => {
            if (!profile?.id) return [];

            const { data, error } = await supabase
                .from('cases')
                .select('*')
                .eq('user_id', profile.id)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!profile?.id && isOpen
    });


    // Fetch messages for expanded case
    const { data: messages, refetch: refetchMessages } = useQuery({
        queryKey: ['case-messages', expandedCase],
        queryFn: async () => {
            if (!expandedCase) return [];

            const { data, error } = await supabase
                .from('case_messages')
                .select('*')
                .eq('case_id', expandedCase)
                .eq('is_internal', false)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data;
        },
        enabled: !!expandedCase
    });

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!expandedCase || !replyMessage.trim()) return;

        setReplyLoading(true);
        try {
            const { error } = await supabase
                .from("case_messages")
                .insert({
                    case_id: expandedCase,
                    sender_id: profile?.id,
                    content: replyMessage.trim(),
                    is_internal: false,
                });

            if (error) throw error;

            setReplyMessage("");
            refetchMessages();

            // Optional: You might want to update the case status to 'open' or similar if it was resolved
            // But for now we just send the message

        } catch (error: any) {
            console.error("Error sending reply:", error);
            toast({
                title: "Failed to send reply",
                description: error.message || "An error occurred while sending your message.",
                variant: "destructive",
            });
        } finally {
            setReplyLoading(false);
        }
    };

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
                description: `Your case #${caseData.id.slice(0, 8)} has been created. Check the "My Tickets" tab to track responses.`,
            });

            setSubject("");
            setType("other");
            setMessage("");
            refetchCases();
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new':
                return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'in-progress':
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'resolved':
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
            default:
                return 'bg-muted text-muted-foreground border-border/30';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            case 'high':
                return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'medium':
                return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            default:
                return 'bg-muted text-muted-foreground border-border/30';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] glass-card neon-border-pink">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-primary" />
                        </div>
                        <DialogTitle className="text-xl font-bold gradient-text">Support Center</DialogTitle>
                    </div>
                    <DialogDescription className="text-muted-foreground">
                        Create a new ticket or view your existing support requests
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="create" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="create">Create Ticket</TabsTrigger>
                        <TabsTrigger value="tickets">My Tickets</TabsTrigger>
                    </TabsList>

                    <TabsContent value="create" className="space-y-4 py-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
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
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            Send Request
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>

                    <TabsContent value="tickets" className="py-4 max-h-[500px] overflow-y-auto">
                        {isLoadingCases ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : !cases || cases.length === 0 ? (
                            <div className="text-center py-12">
                                <Inbox className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <h3 className="text-lg font-bold uppercase tracking-tight mb-2">
                                    No Tickets Yet
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Create your first support ticket using the "Create Ticket" tab
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {cases.map((caseItem) => {
                                    const isExpanded = expandedCase === caseItem.id;
                                    const caseMessages = isExpanded ? messages : [];

                                    return (
                                        <Card
                                            key={caseItem.id}
                                            className={cn(
                                                "border-border/50 bg-muted/5 transition-all overflow-hidden",
                                                isExpanded && "ring-2 ring-primary/20"
                                            )}
                                        >
                                            <button
                                                onClick={() => setExpandedCase(isExpanded ? null : caseItem.id)}
                                                className="w-full p-4 text-left hover:bg-white/5 transition-colors"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-mono text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                                                                #{caseItem.id.slice(0, 8)}
                                                            </span>
                                                            <h4 className="text-sm font-bold tracking-tight truncate">
                                                                {caseItem.subject}
                                                            </h4>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {new Date(caseItem.updated_at || caseItem.created_at).toLocaleDateString()}
                                                            </span>
                                                            <span className="uppercase font-bold">{caseItem.type}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge className={cn("text-xs font-black uppercase border", getStatusColor(caseItem.status))}>
                                                            {caseItem.status}
                                                        </Badge>
                                                        <ChevronRight className={cn(
                                                            "h-4 w-4 text-muted-foreground transition-transform",
                                                            isExpanded && "rotate-90"
                                                        )} />
                                                    </div>
                                                </div>
                                            </button>

                                            {isExpanded && (
                                                <div className="border-t border-border/50 bg-background/50 p-4">
                                                    {!caseMessages || caseMessages.length === 0 ? (
                                                        <div className="text-center py-6 text-muted-foreground">
                                                            <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-50" />
                                                            <p className="text-xs font-bold uppercase tracking-widest">
                                                                No messages yet
                                                            </p>
                                                            <p className="text-xs mt-1">
                                                                Our support team will respond soon
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            {caseMessages.map((msg) => {
                                                                const isAgent = msg.sender_id !== profile?.id;
                                                                return (
                                                                    <div
                                                                        key={msg.id}
                                                                        className={cn(
                                                                            "flex gap-3 max-w-[90%]",
                                                                            isAgent ? "ml-auto flex-row-reverse" : ""
                                                                        )}
                                                                    >
                                                                        <Avatar className="h-8 w-8 flex-shrink-0 mt-1 ring-2 ring-border/20">
                                                                            <AvatarFallback className={cn(
                                                                                "font-black text-xs",
                                                                                isAgent ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                                                                            )}>
                                                                                {isAgent ? 'A' : profile?.username?.[0]?.toUpperCase() || 'U'}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div className={cn("space-y-1", isAgent ? "items-end" : "items-start")}>
                                                                            <div className={cn("flex items-center gap-2 px-1", isAgent ? "flex-row-reverse" : "")}>
                                                                                <span className="text-xs font-black uppercase tracking-widest text-primary">
                                                                                    {isAgent ? "Support" : "You"}
                                                                                </span>
                                                                                <span className="text-xs text-muted-foreground font-mono">
                                                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                </span>
                                                                            </div>
                                                                            <div className={cn(
                                                                                "px-3 py-2 rounded-xl text-sm leading-relaxed shadow-sm border",
                                                                                isAgent
                                                                                    ? "bg-primary text-primary-foreground border-primary/20 rounded-tr-none"
                                                                                    : "bg-muted text-foreground border-border/50 rounded-tl-none"
                                                                            )}>
                                                                                {msg.content}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* Reply Input */}
                                                    <div className="mt-4 pt-4 border-t border-border/50">
                                                        <form onSubmit={handleReply} className="flex gap-2">
                                                            <Input
                                                                value={replyMessage}
                                                                onChange={(e) => setReplyMessage(e.target.value)}
                                                                placeholder="Type your reply..."
                                                                className="bg-background/50 border-border/50 focus:neon-border-cyan transition-all"
                                                                disabled={replyLoading}
                                                            />
                                                            <Button
                                                                type="submit"
                                                                disabled={!replyMessage.trim() || replyLoading}
                                                                size="icon"
                                                                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shrink-0 hover:neon-glow-pink transition-all duration-300"
                                                            >
                                                                {replyLoading ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Send className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </form>
                                                    </div>
                                                </div>
                                            )}
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
