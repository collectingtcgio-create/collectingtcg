import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    MessageSquare,
    Clock,
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    Inbox
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function MyTickets() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [expandedCase, setExpandedCase] = useState<string | null>(null);

    // Fetch user's cases
    const { data: cases, isLoading } = useQuery({
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
        enabled: !!profile?.id
    });

    // Fetch messages for expanded case
    const { data: messages } = useQuery({
        queryKey: ['case-messages', expandedCase],
        queryFn: async () => {
            if (!expandedCase) return [];

            const { data, error } = await supabase
                .from('case_messages')
                .select('*')
                .eq('case_id', expandedCase)
                .eq('is_internal', false) // Only show non-internal messages to users
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data;
        },
        enabled: !!expandedCase
    });

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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                        Loading your tickets...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border/50 bg-muted/5 backdrop-blur-xl sticky top-0 z-10">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter uppercase">My Support Tickets</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                View and track your support requests
                            </p>
                        </div>
                        <Button
                            onClick={() => navigate('/')}
                            variant="outline"
                            className="rounded-xl"
                        >
                            Back to Home
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-8">
                {!cases || cases.length === 0 ? (
                    <Card className="p-12 text-center border-border/50 bg-muted/5">
                        <Inbox className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h2 className="text-xl font-black uppercase tracking-tighter mb-2">
                            No Support Tickets Yet
                        </h2>
                        <p className="text-muted-foreground mb-6">
                            You haven't created any support tickets. Need help? Click the support button below.
                        </p>
                        <Button
                            onClick={() => window.dispatchEvent(new Event('open-support-modal'))}
                            className="bg-primary hover:bg-primary/90 rounded-xl"
                        >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Contact Support
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-4">
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
                                    {/* Case Header */}
                                    <button
                                        onClick={() => setExpandedCase(isExpanded ? null : caseItem.id)}
                                        className="w-full p-6 text-left hover:bg-white/5 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="font-mono text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">
                                                        #{caseItem.id.slice(0, 8)}
                                                    </span>
                                                    <h3 className="text-lg font-black tracking-tight uppercase truncate">
                                                        {caseItem.subject}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(caseItem.updated_at || caseItem.created_at).toLocaleDateString()}
                                                    </span>
                                                    <span className="uppercase font-bold">{caseItem.type}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge className={cn("text-xs font-black uppercase border", getStatusColor(caseItem.status))}>
                                                    {caseItem.status}
                                                </Badge>
                                                <Badge className={cn("text-xs font-black uppercase border", getPriorityColor(caseItem.priority))}>
                                                    {caseItem.priority}
                                                </Badge>
                                                <ChevronRight className={cn(
                                                    "h-5 w-5 text-muted-foreground transition-transform",
                                                    isExpanded && "rotate-90"
                                                )} />
                                            </div>
                                        </div>
                                    </button>

                                    {/* Expanded Messages */}
                                    {isExpanded && (
                                        <div className="border-t border-border/50 bg-background/50 p-6">
                                            {!caseMessages || caseMessages.length === 0 ? (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm font-bold uppercase tracking-widest">
                                                        No messages yet
                                                    </p>
                                                    <p className="text-xs mt-1">
                                                        Our support team will respond soon
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    {caseMessages.map((msg) => {
                                                        const isAgent = msg.sender_id !== profile?.id;
                                                        return (
                                                            <div
                                                                key={msg.id}
                                                                className={cn(
                                                                    "flex gap-4 max-w-[85%]",
                                                                    isAgent ? "ml-auto flex-row-reverse" : ""
                                                                )}
                                                            >
                                                                <Avatar className="h-9 w-9 flex-shrink-0 mt-1 ring-2 ring-border/20">
                                                                    <AvatarFallback className={cn(
                                                                        "font-black text-xs",
                                                                        isAgent ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                                                                    )}>
                                                                        {isAgent ? 'A' : profile?.username?.[0]?.toUpperCase() || 'U'}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className={cn("space-y-2", isAgent ? "items-end" : "items-start")}>
                                                                    <div className={cn("flex items-center gap-3 px-1", isAgent ? "flex-row-reverse" : "")}>
                                                                        <span className="text-xs font-black uppercase tracking-widest text-primary">
                                                                            {isAgent ? "Support Agent" : "You"}
                                                                        </span>
                                                                        <span className="text-xs text-muted-foreground font-mono">
                                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                    </div>
                                                                    <div className={cn(
                                                                        "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm border",
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
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
