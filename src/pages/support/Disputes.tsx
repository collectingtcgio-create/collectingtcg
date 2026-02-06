import { SupportLayout } from "@/components/support/SupportLayout";
import { Search, Gavel, Clock, User, ChevronRight, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function Disputes() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");

    const { data: cases, isLoading } = useQuery({
        queryKey: ['disputes'],
        queryFn: async () => {
            let query = supabase
                .from('cases')
                .select('*, profiles!cases_user_id_fkey(username)')
                .eq('type', 'dispute')
                .order('updated_at', { ascending: false });

            const { data, error } = await query;
            if (error) throw error;
            return data;
        }
    });

    // Filter by search query on the client side
    const filteredCases = cases?.filter(c => {
        const matchesSearch = !searchQuery ||
            c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.profiles as any)?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.subject?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'open': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'resolved': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
            default: return 'bg-muted/10 text-muted-foreground border-border/20';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (status) {
            case 'urgent': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'normal': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'low': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
            default: return 'bg-muted/10 text-muted-foreground border-border/20';
        }
    };

    return (
        <SupportLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter uppercase leading-none flex items-center gap-2">
                            <Gavel className="h-6 w-6 text-[#7c3aed]" />
                            Dispute Resolution
                        </h1>
                        <p className="text-xs text-muted-foreground mt-1 font-medium italic">
                            Mediate conflicts and ensure fair marketplace transactions
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="h-7 border-[#7c3aed]/30 text-[#7c3aed] bg-[#7c3aed]/5 font-black text-xs uppercase tracking-widest px-3">
                            {filteredCases?.length || 0} Active
                        </Badge>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[#7c3aed] transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by ID, username, or subject keyword..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-muted/10 border-border/50 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#7c3aed] transition-all"
                    />
                </div>

                {isLoading ? (
                    <div className="glass-card p-24 flex flex-col items-center justify-center border-border/50">
                        <Loader2 className="h-10 w-10 animate-spin text-[#7c3aed] mb-4 opacity-50" />
                        <p className="text-sm font-bold uppercase tracking-widest opacity-30 animate-pulse">Loading disputes...</p>
                    </div>
                ) : (!filteredCases || filteredCases.length === 0) ? (
                    <div className="glass-card p-24 flex flex-col items-center justify-center text-center space-y-4 border-dashed border-2 border-border/30 bg-muted/5">
                        <div className="w-16 h-16 rounded-3xl bg-muted/20 flex items-center justify-center">
                            <Gavel className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground/50">No disputes found</h3>
                            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                                There are currently no active disputes.
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
                                className="group p-5 flex flex-col md:flex-row md:items-center gap-6 hover:bg-[#7c3aed]/5 transition-all cursor-pointer border-l-[4px] border-transparent hover:border-[#7c3aed] glass-card"
                            >
                                {/* Left: Priority Indicator & Icon */}
                                <div className="flex items-center gap-4 md:w-48">
                                    <div className={cn(
                                        "w-3 h-3 rounded-full shrink-0",
                                        c.priority === 'urgent' ? "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse" :
                                            c.priority === 'high' ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" :
                                                "bg-blue-500"
                                    )} />
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                                            <AlertTriangle className="h-5 w-5 text-rose-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Dispute</p>
                                            <p className="text-xs font-mono text-muted-foreground/70">#{c.id.slice(0, 8)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Center: Case Details */}
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="font-bold text-sm group-hover:text-[#7c3aed] transition-colors">
                                                {c.subject || "Untitled Dispute"}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <User className="h-3 w-3" />
                                                    <span>{(c.profiles as any)?.username || 'Unknown User'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{new Date(c.updated_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Status & Priority */}
                                <div className="flex md:flex-col items-start gap-2 md:w-32">
                                    <Badge variant="outline" className={cn(
                                        "text-[10px] font-bold uppercase tracking-widest px-2 py-1 border",
                                        getStatusColor(c.status)
                                    )}>
                                        {c.status}
                                    </Badge>
                                    <Badge variant="outline" className={cn(
                                        "text-[10px] font-bold uppercase tracking-widest px-2 py-1 border",
                                        getPriorityColor(c.priority)
                                    )}>
                                        {c.priority}
                                    </Badge>
                                </div>

                                {/* Arrow */}
                                <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-[#7c3aed] group-hover:translate-x-1 transition-all shrink-0" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </SupportLayout>
    );
}
