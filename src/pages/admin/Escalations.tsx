import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
    ShieldAlert,
    MessageSquare,
    User,
    Clock,
    CheckCircle2,
    XCircle,
    MoreVertical,
    ChevronRight,
    Send,
    Lock,
    Flag,
    AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { logAuditAction } from "@/lib/audit";
import { cn } from "@/lib/utils";

export default function AdminEscalations() {
    const { user: actor } = useAuth();
    const queryClient = useQueryClient();
    const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const [isInternal, setIsInternal] = useState(true);

    // Fetch escalated cases
    const { data: cases, isLoading: casesLoading } = useQuery({
        queryKey: ['admin-escalated-cases'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cases')
                .select('*, profiles!user_id(username)')
                .eq('status', 'escalated')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        }
    });

    // Fetch messages for selected case
    const { data: messages, isLoading: messagesLoading } = useQuery({
        queryKey: ['case-messages', selectedCaseId],
        queryFn: async () => {
            if (!selectedCaseId) return [];
            const { data, error } = await supabase
                .from('case_messages')
                .select('*, profiles:sender_id(username)')
                .eq('case_id', selectedCaseId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data;
        },
        enabled: !!selectedCaseId
    });

    const selectedCase = cases?.find(c => c.id === selectedCaseId);

    // Send Message Mutation
    const sendMessage = useMutation({
        mutationFn: async () => {
            if (!selectedCaseId || !newMessage.trim()) return;

            const { error } = await supabase
                .from('case_messages')
                .insert({
                    case_id: selectedCaseId,
                    sender_id: actor?.id,
                    content: newMessage,
                    is_internal: isInternal
                });

            if (error) throw error;

            // Update case updated_at
            await supabase.from('cases').update({ updated_at: new Date().toISOString() }).eq('id', selectedCaseId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['case-messages', selectedCaseId] });
            setNewMessage("");
            toast.success(isInternal ? "Internal note added." : "Message sent to user.");
        }
    });

    // Resolve Case Mutation
    const resolveCase = useMutation({
        mutationFn: async (status: 'closed' | 'resolved') => {
            if (!selectedCaseId) return;

            const { error } = await supabase
                .from('cases')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', selectedCaseId);

            if (error) throw error;

            await logAuditAction({
                actorId: actor?.id || '',
                actorRole: 'admin',
                actionType: 'case_resolved',
                targetType: 'case',
                targetId: selectedCaseId,
                reason: `Case ${status} by admin.`
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-escalated-cases'] });
            setSelectedCaseId(null);
            toast.success("Case marked as resolved.");
        }
    });

    return (
        <AdminLayout title="Escalation Desk">
            <div className="flex h-[calc(100vh-12rem)] gap-6">
                {/* Case List */}
                <div className="w-80 flex flex-col gap-4">
                    <div className="relative">
                        <Badge variant="outline" className="bg-rose-900/20 text-rose-400 border-rose-500/30 mb-2">
                            {cases?.length || 0} Escalated Cases
                        </Badge>
                    </div>
                    <ScrollArea className="flex-1 border border-border/40 rounded-xl bg-[#0c0c0e]">
                        <div className="divide-y divide-border/40">
                            {casesLoading ? (
                                <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">Loading desk...</div>
                            ) : !cases || cases.length === 0 ? (
                                <div className="p-8 text-center text-xs text-muted-foreground italic">No cases in queue.</div>
                            ) : (
                                cases.map((c) => (
                                    <button
                                        key={c.id}
                                        onClick={() => setSelectedCaseId(c.id)}
                                        className={cn(
                                            "w-full p-4 text-left transition-colors hover:bg-white/5 group",
                                            selectedCaseId === c.id ? "bg-white/5 border-l-2 border-primary" : "border-l-2 border-transparent"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{c.type}</span>
                                            <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{c.subject}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                            <User className="w-3 h-3" /> {c.profiles?.username || 'Unknown'}
                                        </p>
                                    </button>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Case Details / Chat */}
                <div className="flex-1 flex flex-col bg-[#0c0c0e] border border-border/40 rounded-xl overflow-hidden">
                    {selectedCase ? (
                        <>
                            <div className="p-4 border-b border-border/40 bg-white/5 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold">{selectedCase.subject}</h3>
                                        <Badge variant="outline" className="bg-amber-900/20 text-amber-400 border-amber-500/30 text-[10px] uppercase">
                                            {selectedCase.priority}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground italic">ID: {selectedCase.id}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="h-8 text-xs border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10" onClick={() => resolveCase.mutate('resolved')}>
                                        <CheckCircle2 className="w-4 h-4 mr-2" /> Resolve
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <ScrollArea className="flex-1 p-6">
                                <div className="space-y-6">
                                    {messagesLoading ? (
                                        <div className="text-center py-12 animate-pulse text-muted-foreground">Retrieving history...</div>
                                    ) : messages?.map((m) => (
                                        <div key={m.id} className={cn(
                                            "flex flex-col gap-2 max-w-[80%]",
                                            m.sender_id === actor?.id ? "ml-auto items-end" : "items-start"
                                        )}>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase">{m.profiles?.username || 'System'}</span>
                                                {m.is_internal && <Badge variant="outline" className="text-[8px] h-3 bg-amber-900/20 text-amber-500 border-amber-500/20">INTERNAL</Badge>}
                                                <span className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className={cn(
                                                "p-3 rounded-lg text-sm border shadow-sm",
                                                m.is_internal ? "bg-amber-900/10 border-amber-500/20 text-amber-200/80" :
                                                    m.sender_id === actor?.id ? "bg-primary/10 border-primary/20 text-slate-200" : "bg-white/5 border-border/40 text-slate-300"
                                            )}>
                                                {m.content}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>

                            <div className="p-4 border-t border-border/40 bg-white/5 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn("h-7 text-[10px] font-bold uppercase tracking-widest", isInternal ? "text-amber-500" : "text-muted-foreground")}
                                        onClick={() => setIsInternal(true)}
                                    >
                                        <Lock className="w-3 h-3 mr-1" /> Internal Note
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn("h-7 text-[10px] font-bold uppercase tracking-widest", !isInternal ? "text-primary" : "text-muted-foreground")}
                                        onClick={() => setIsInternal(false)}
                                    >
                                        <Send className="w-3 h-3 mr-1" /> Reply to User
                                    </Button>
                                </div>
                                <div className="flex gap-2">
                                    <Textarea
                                        placeholder={isInternal ? "Add internal note (visible only to staff)..." : "Send message to user..."}
                                        className="min-h-[80px] bg-black/40 border-border/40 resize-none focus:border-primary/50"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                    />
                                    <div className="flex flex-col justify-end">
                                        <Button
                                            size="icon"
                                            className="h-10 w-10 bg-primary hover:bg-primary/90"
                                            disabled={!newMessage.trim() || sendMessage.isPending}
                                            onClick={() => sendMessage.mutate()}
                                        >
                                            <Send className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-border/40">
                                <ShieldAlert className="w-8 h-8 opacity-20" />
                            </div>
                            <p className="font-semibold text-slate-300">No Case Selected</p>
                            <p className="max-w-xs text-xs mt-2 italic">Select an escalated case from the left panel to begin review and resolution.</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
