import { SupportLayout } from "@/components/support/SupportLayout";
import { Search, Filter, MessageSquare, Clock, User, ChevronRight, Inbox, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function SupportInbox({ filter }: { filter?: string }) {
    const navigate = useNavigate();

    const { data: cases, isLoading, error } = useQuery({
        queryKey: ['support-cases', filter],
        queryFn: async () => {
            console.log('[Inbox] Fetching cases with filter:', filter);
            let query = supabase
                .from('cases')
                .select('*, profiles!cases_user_id_fkey(username)')
                .order('updated_at', { ascending: false });

            if (filter) {
                query = query.eq('type', filter);
            }

            const { data, error } = await query;

            if (error) {
                console.error('[Inbox] Error fetching cases:', error);
                throw error;
            }

            console.log('[Inbox] Fetched cases:', data);
            return data;
        }
    });

    console.log('[Inbox] Render - isLoading:', isLoading, 'cases:', cases, 'error:', error);

    return (
        <SupportLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">
                            {filter ? `${filter}s` : "Universal Inbox"}
                        </h1>
                        <p className="text-xs text-muted-foreground mt-1 font-medium italic">
                            Streamlining communication with global collectors
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-9 border-border/50 bg-muted/5 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all">
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                        </Button>
                        <Button size="sm" className="h-9 bg-[#7c3aed] hover:bg-[#7c3aed]/90 text-[10px] font-bold uppercase tracking-widest text-white shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                            Create New Case
                        </Button>
                    </div>
                </div>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[#7c3aed] transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by ID, username, or subject keyword..."
                        className="w-full bg-muted/10 border-border/50 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#7c3aed] transition-all"
                    />
                </div>

                {isLoading ? (
                    <div className="glass-card p-24 flex flex-col items-center justify-center border-border/50">
                        <Loader2 className="h-10 w-10 animate-spin text-[#7c3aed] mb-4 opacity-50" />
                        <p className="text-sm font-bold uppercase tracking-widest opacity-30 animate-pulse">Syncing cases...</p>
                    </div>
                ) : (!cases || cases.length === 0) ? (
                    <div className="glass-card p-24 flex flex-col items-center justify-center text-center space-y-4 border-dashed border-2 border-border/30 bg-muted/5">
                        <div className="w-16 h-16 rounded-3xl bg-muted/20 flex items-center justify-center">
                            <Inbox className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground/50">Your inbox is clear</h3>
                            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                                There are currently no active support requests matching your filters.
                            </p>
                        </div>
                        <Button variant="outline" className="h-10 px-8 border-border/50 text-[10px] font-black uppercase tracking-widest" onClick={() => navigate('/support')}>
                            Check Dashboard
                        </Button>
                    </div>
                ) : (
                    <div className="glass-card overflow-hidden border-border/50">
                        <div className="divide-y divide-border/50 text-sm bg-muted/5">
                            {cases.map((c) => (
                                <div
                                    key={c.id}
                                    onClick={() => navigate(`/support/case/${c.id}`)}
                                    className="group p-5 flex flex-col md:flex-row md:items-center gap-6 hover:bg-[#7c3aed]/5 transition-all cursor-pointer border-l-[4px] border-transparent hover:border-[#7c3aed]"
                                >
                                    <div className="flex-1 space-y-1.5 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-[9px] font-black text-[#7c3aed] bg-[#7c3aed]/10 px-2 py-0.5 rounded-lg border border-[#7c3aed]/20">
                                                {c.id.slice(0, 8)}
                                            </span>
                                            <h3 className="font-bold text-foreground truncate group-hover:text-[#7c3aed] transition-colors text-sm uppercase tracking-tight">
                                                {c.subject}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8 text-xs text-muted-foreground whitespace-nowrap">
                                        <div className="flex items-center gap-2 min-w-[120px]">
                                            <User className="h-4 w-4 text-[#7c3aed]/50" />
                                            <span className="font-semibold text-foreground/80">{(c as any).profiles?.username || 'Guest'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 min-w-[100px]">
                                            <Clock className="h-4 w-4 text-[#7c3aed]/50" />
                                            <span>{new Date(c.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="min-w-[80px]">
                                            <span className={cn(
                                                "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                                                c.status === "new" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                                    c.status === "open" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                                                        "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                            )}>
                                                {c.status}
                                            </span>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-[#7c3aed] group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </SupportLayout>
    );
}
