import { SupportLayout } from "@/components/support/SupportLayout";
import { Search, CheckCircle2, Clock, User, ChevronRight, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function CompletedTickets() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");

    const { data: cases, isLoading } = useQuery({
        queryKey: ['completed-tickets'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cases')
                .select(`
                    *, 
                    profiles!cases_user_id_fkey(username),
                    resolved_by_profile:profiles!cases_resolved_by_fkey(username)
                `)
                .eq('status', 'resolved')
                .order('resolved_at', { ascending: false });

            if (error) throw error;
            return data;
        }
    });

    // Filter by search query on the client side
    const filteredCases = cases?.filter(c => {
        const matchesSearch = !searchQuery ||
            c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.profiles as any)?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.resolved_by_profile as any)?.username?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'dispute': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            case 'refund': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'report': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'other': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            default: return 'bg-muted/10 text-muted-foreground border-border/20';
        }
    };

    return (
        <SupportLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter uppercase leading-none flex items-center gap-2">
                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                            Completed Tickets
                        </h1>
                        <p className="text-xs text-muted-foreground mt-1 font-medium italic">
                            View resolved support cases and agent performance
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="h-7 border-emerald-500/30 text-emerald-500 bg-emerald-500/5 font-black text-xs uppercase tracking-widest px-3">
                            {filteredCases?.length || 0} Resolved
                        </Badge>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[#7c3aed] transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by ID, username, subject, or agent..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-muted/10 border-border/50 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#7c3aed] transition-all"
                    />
                </div>

                {isLoading ? (
                    <div className="glass-card p-24 flex flex-col items-center justify-center border-border/50">
                        <Loader2 className="h-10 w-10 animate-spin text-[#7c3aed] mb-4 opacity-50" />
                        <p className="text-sm font-bold uppercase tracking-widest opacity-30 animate-pulse">Loading completed tickets...</p>
                    </div>
                ) : (!filteredCases || filteredCases.length === 0) ? (
                    <div className="glass-card p-24 flex flex-col items-center justify-center text-center space-y-4 border-dashed border-2 border-border/30 bg-muted/5">
                        <div className="w-16 h-16 rounded-3xl bg-muted/20 flex items-center justify-center">
                            <CheckCircle2 className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground/50">No completed tickets found</h3>
                            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                                There are no resolved support cases yet.
                            </p>
                        </div>
                        <Button variant="outline" className="h-10 px-8 border-border/50 text-[10px] font-black uppercase tracking-widest" onClick={() => navigate('/support')}>
                            Back to Dashboard
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredCases.map((c) => (
                            <div
                                key={c.id}
                                onClick={() => navigate(`/support/case/${c.id}`)}
                                className="group p-5 flex flex-col md:flex-row md:items-center gap-6 hover:bg-emerald-500/5 transition-all cursor-pointer border-l-[4px] border-transparent hover:border-emerald-500 glass-card"
                            >
                                {/* Left: Type Badge & Icon */}
                                <div className="flex items-center gap-4 md:w-48">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{c.type}</p>
                                            <p className="text-xs font-mono text-muted-foreground/70">#{c.id.slice(0, 8)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Center: Case Details */}
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="font-bold text-sm group-hover:text-emerald-500 transition-colors">
                                                {c.subject || "Untitled Case"}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <User className="h-3 w-3" />
                                                    <span>{(c.profiles as any)?.username || 'Unknown User'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    <span>Resolved {new Date(c.resolved_at!).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Agent Info */}
                                <div className="flex md:flex-col items-start gap-2 md:w-40">
                                    <Badge variant="outline" className={cn(
                                        "text-[10px] font-bold uppercase tracking-widest px-2 py-1 border",
                                        getTypeColor(c.type)
                                    )}>
                                        {c.type}
                                    </Badge>
                                    <div className="flex items-center gap-1.5 text-xs text-emerald-500">
                                        <Shield className="h-3 w-3" />
                                        <span className="font-bold">{(c.resolved_by_profile as any)?.username || 'Unknown Agent'}</span>
                                    </div>
                                </div>

                                {/* Arrow */}
                                <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all shrink-0" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </SupportLayout>
    );
}
