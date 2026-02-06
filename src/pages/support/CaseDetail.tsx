import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SupportLayout } from "@/components/support/SupportLayout";
import {
    ArrowLeft,
    Send,
    Lock,
    User,
    Clock,
    AlertCircle,
    MoreVertical,
    CheckCircle2,
    Share2,
    Trash2,
    Loader2,
    MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function CaseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const queryClient = useQueryClient();
    const [message, setMessage] = useState("");
    const [isInternal, setIsInternal] = useState(false);

    // 1. Fetch Case Details
    const { data: caseData, isLoading: isLoadingCase } = useQuery({
        queryKey: ['case', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cases')
                .select('*, profiles!cases_user_id_fkey(username, avatar_url, email_contact)')
                .eq('id', id)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!id
    });

    // 2. Fetch Messages
    const { data: messages, isLoading: isLoadingMessages } = useQuery({
        queryKey: ['case-messages', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('case_messages')
                .select('*')
                .eq('case_id', id)
                .order('created_at', { ascending: true });
            if (error) throw error;
            return data;
        },
        enabled: !!id
    });

    // 3. Send Message Mutation
    const sendMessage = useMutation({
        mutationFn: async (content: string) => {
            const { error } = await supabase.from('case_messages').insert({
                case_id: id,
                sender_id: profile?.id,
                content,
                is_internal: isInternal
            });
            if (error) throw error;
        },
        onSuccess: () => {
            setMessage("");
            queryClient.invalidateQueries({ queryKey: ['case-messages', id] });
        }
    });

    // 4. Mark Resolved Mutation
    const markResolved = useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from('cases')
                .update({
                    status: 'resolved',
                    resolved_by: profile?.id,
                    resolved_at: new Date().toISOString()
                })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['case', id] });
            queryClient.invalidateQueries({ queryKey: ['cases'] });
            queryClient.invalidateQueries({ queryKey: ['disputes'] });
        }
    });

    const handleSend = () => {
        if (!message.trim()) return;
        sendMessage.mutate(message);
    };

    const handleMarkResolved = () => {
        if (window.confirm('Mark this case as resolved? This will close the ticket.')) {
            markResolved.mutate();
        }
    };

    if (isLoadingCase || isLoadingMessages) {
        return (
            <SupportLayout>
                <div className="h-full flex flex-col items-center justify-center p-24 opacity-50">
                    <Loader2 className="h-10 w-10 animate-spin text-[#7c3aed] mb-4" />
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#7c3aed]">Decoding Thread...</p>
                </div>
            </SupportLayout>
        );
    }

    if (!caseData) {
        return (
            <SupportLayout>
                <div className="h-full flex flex-col items-center justify-center p-24 text-center">
                    <AlertCircle className="h-12 w-12 text-rose-500 mb-4 opacity-50" />
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Case Not Found</h2>
                    <p className="text-muted-foreground mt-2 font-medium">This support record may have been archived or deleted.</p>
                    <Button onClick={() => navigate("/support/inbox")} variant="outline" className="mt-6 border-[#7c3aed]/30 text-[#7c3aed] h-10 px-8">
                        Back to Inbox
                    </Button>
                </div>
            </SupportLayout>
        );
    }

    return (
        <SupportLayout>
            <div className="h-full flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate("/support/inbox")}
                            className="h-10 w-10 text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl transition-all"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <span className="font-mono text-[10px] font-black text-[#7c3aed] bg-[#7c3aed]/10 px-2.5 py-1 rounded-lg border border-[#7c3aed]/20 shadow-[0_0_15px_rgba(124,58,237,0.1)]">
                                    {caseData.id.slice(0, 8)}
                                </span>
                                <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">{caseData.subject}</h1>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-3 font-bold uppercase tracking-widest opacity-60">
                                <span className="flex items-center gap-1.5 text-[#7c3aed]"><User className="h-3 w-3" /> {(caseData as any).profiles?.username || 'Guest'}</span>
                                <span className="text-border">|</span>
                                <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {new Date(caseData.created_at).toLocaleString()}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" className="h-10 border-border/50 bg-background text-[10px] font-black uppercase tracking-widest hover:bg-white/5">
                            Escalate
                        </Button>
                        {caseData.status === 'resolved' ? (
                            <Button
                                size="sm"
                                disabled
                                className="h-10 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-6 shadow-lg shadow-emerald-500/20 opacity-60 cursor-not-allowed"
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Resolved
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                onClick={handleMarkResolved}
                                disabled={markResolved.isPending}
                                className="h-10 bg-[#7c3aed] hover:bg-[#7c3aed]/90 text-white text-[10px] font-black uppercase tracking-widest px-6 shadow-lg shadow-[#7c3aed]/20"
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                {markResolved.isPending ? 'Resolving...' : 'Mark Resolved'}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-0">
                    {/* Conversation Thread */}
                    <div className="lg:col-span-3 glass-card flex flex-col min-h-0 border-border/50 bg-muted/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#7c3aed]/5 -mr-32 -mt-32 rounded-full blur-[100px] pointer-events-none" />

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide relative z-10">
                            {(!messages || messages.length === 0) ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4 text-center">
                                    <MessageCircle className="h-12 w-12" />
                                    <div>
                                        <p className="text-sm font-black uppercase tracking-widest text-foreground">Awaiting transmission</p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest mt-1">Send the first reply to start the thread</p>
                                    </div>
                                </div>
                            ) : messages.map((msg) => {
                                const isAgent = msg.sender_id !== caseData.user_id;
                                return (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            "flex gap-4 max-w-[85%] animate-in fade-in slide-in-from-bottom-4 duration-300",
                                            isAgent ? "ml-auto flex-row-reverse" : ""
                                        )}
                                    >
                                        <Avatar className="h-9 w-9 flex-shrink-0 mt-1 ring-2 ring-border/20 shadow-xl">
                                            <AvatarFallback className={cn("font-black text-xs", isAgent ? "bg-[#7c3aed] text-white" : "bg-muted text-foreground")}>
                                                {isAgent ? 'A' : (caseData as any).profiles?.username?.[0]?.toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className={cn(
                                            "space-y-2",
                                            isAgent ? "items-end" : "items-start"
                                        )}>
                                            <div className={cn("flex items-center gap-3 px-1", isAgent ? "flex-row-reverse" : "")}>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-[#7c3aed]">
                                                    {isAgent ? "Support Agent" : "Target User"}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-mono opacity-50">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {msg.is_internal && (
                                                    <span className="flex items-center gap-1.5 text-[8px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                                                        <Lock className="h-2.5 w-2.5" /> Internal Note
                                                    </span>
                                                )}
                                            </div>
                                            <div className={cn(
                                                "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm border transition-all",
                                                msg.is_internal ? "bg-amber-500/5 border-amber-500/20 text-amber-500/90 italic" :
                                                    isAgent ? "bg-[#7c3aed] text-white border-[#7c3aed]/20 rounded-tr-none" :
                                                        "bg-white/5 text-foreground border-border/50 rounded-tl-none"
                                            )}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Input Area */}
                        <div className="p-6 border-t border-border/50 bg-[#09090b]/50 backdrop-blur-xl relative z-20">
                            <div className="flex items-center gap-6 mb-4 px-1">
                                <button
                                    onClick={() => setIsInternal(false)}
                                    className={cn(
                                        "text-[10px] font-black uppercase tracking-widest transition-all pb-1 border-b-2 outline-none",
                                        !isInternal ? "text-[#7c3aed] border-[#7c3aed]" : "text-muted-foreground border-transparent hover:text-white"
                                    )}
                                >
                                    Public Broadcast
                                </button>
                                <button
                                    onClick={() => setIsInternal(true)}
                                    className={cn(
                                        "text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all pb-1 border-b-2 outline-none",
                                        isInternal ? "text-amber-500 border-amber-500" : "text-muted-foreground border-transparent hover:text-white"
                                    )}
                                >
                                    <Lock className="h-3 w-3" /> Private Encryption
                                </button>
                            </div>
                            <div className="relative group">
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                            handleSend();
                                        }
                                    }}
                                    placeholder={isInternal ? "Log an internal note for staff documentation..." : "Enter your transmission to the collector..."}
                                    className={cn(
                                        "w-full bg-muted/20 border-border/50 rounded-2xl p-4 pr-16 text-sm focus:outline-none focus:ring-2 transition-all resize-none h-28 border border-transparent",
                                        isInternal ? "focus:ring-amber-500/30" : "focus:ring-[#7c3aed]/30"
                                    )}
                                />
                                <Button
                                    size="icon"
                                    onClick={handleSend}
                                    disabled={!message.trim() || sendMessage.isPending}
                                    className={cn(
                                        "absolute bottom-4 right-4 h-10 w-10 rounded-xl transition-all shadow-xl active:scale-90",
                                        isInternal ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20" : "bg-[#7c3aed] hover:bg-[#7c3aed]/90 shadow-[#7c3aed]/20"
                                    )}
                                >
                                    {sendMessage.isPending ? (
                                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                                    ) : (
                                        <Send className="h-5 w-5 text-white" />
                                    )}
                                </Button>
                            </div>
                            <div className="flex justify-between mt-3 px-1">
                                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest opacity-50">
                                    Cmd + Enter to Transmit
                                </p>
                                <p className="text-[9px] text-[#7c3aed] font-black uppercase tracking-widest hover:underline cursor-pointer">
                                    Use /templates
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        <div className="glass-card p-6 border-border/50 bg-muted/5 relative overflow-hidden">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#7c3aed] mb-6 flex items-center gap-2">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Metadata Summary
                            </h3>
                            <div className="space-y-5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Current Status</span>
                                    <span className={cn(
                                        "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                        caseData.status === 'new' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                    )}>
                                        {caseData.status}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Priority Level</span>
                                    <span className={cn(
                                        "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                        caseData.priority === 'urgent' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-muted text-muted-foreground border-border/30"
                                    )}>
                                        {caseData.priority || 'standard'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Protocol Type</span>
                                    <span className="text-xs font-black uppercase tracking-tighter text-white">{caseData.type}</span>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-6 border-border/50 bg-muted/5">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#7c3aed] mb-6">Subject Identity</h3>
                            <div className="flex items-center gap-4 mb-6">
                                <Avatar className="h-12 w-12 ring-2 ring-border/20 shadow-lg">
                                    <AvatarImage src={(caseData as any).profiles?.avatar_url} />
                                    <AvatarFallback className="bg-muted text-sm font-black">{(caseData as any).profiles?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="text-base font-black tracking-tighter uppercase leading-none">{(caseData as any).profiles?.username || 'Guest'}</h4>
                                    <p className="text-[10px] text-muted-foreground font-mono mt-1">{(caseData as any).profiles?.email_contact || 'Private Identity'}</p>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full text-[10px] font-black uppercase tracking-[0.2em] h-10 border-border/50 bg-background hover:bg-white/5 transition-all">
                                Inspect Profile
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </SupportLayout>
    );
}
