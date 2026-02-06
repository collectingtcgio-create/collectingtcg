import { ChevronUp, ChevronDown, ExternalLink, Loader2, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

export function PriorityQueue() {
    const { data: cases, isLoading } = useQuery({
        queryKey: ['priority-queue'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cases')
                .select('*, profiles(username)')
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) throw error;
            return data;
        }
    });

    if (isLoading) {
        return (
            <div className="glass-card p-8 flex flex-col items-center justify-center border-border/50">
                <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed] mb-4" />
                <p className="text-sm text-muted-foreground">Loading priority queue...</p>
            </div>
        );
    }

    return (
        <div className="glass-card overflow-hidden border-border/50">
            <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/10">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold tracking-tight text-sm uppercase tracking-widest">Priority Queue</h3>
                    <div className="px-1.5 py-0.5 rounded bg-[#7c3aed]/10 text-[#7c3aed] text-[10px] font-black">{cases?.length || 0}</div>
                </div>
                <Link to="/support/inbox">
                    <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-[#7c3aed] hover:bg-[#7c3aed]/10">
                        View all cases →
                    </Button>
                </Link>
            </div>

            {(!cases || cases.length === 0) ? (
                <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center">
                        <Inbox className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                    <div>
                        <p className="text-sm font-bold opacity-50">Nothing to prioritize</p>
                        <p className="text-xs text-muted-foreground">All support channels are currently clear.</p>
                    </div>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-muted-foreground border-b border-border/50 bg-muted/20">
                                <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest">Type</th>
                                <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest">User</th>
                                <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest">Age</th>
                                <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {cases.map((item, i) => (
                                <tr key={item.id} className="group hover:bg-[#7c3aed]/5 transition-colors">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                item.priority === 'urgent' ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)] animate-pulse" : "bg-muted"
                                            )} />
                                            <span className="font-bold text-xs uppercase tracking-tight">{item.type}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-xs font-medium">
                                        {(item as any).profiles?.username || 'Guest User'}
                                    </td>
                                    <td className="px-4 py-4 text-[10px] text-muted-foreground font-mono">
                                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <Link to={`/support/case/${item.id}`}>
                                            <Button size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest bg-[#7c3aed] hover:bg-[#7c3aed]/90 text-white">
                                                Take Case
                                            </Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
