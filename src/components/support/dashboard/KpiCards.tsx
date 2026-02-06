import { Ticket, Gavel, Flag, CreditCard, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function KpiCards() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['support-kpis'],
        queryFn: async () => {
            const [
                { count: tickets },
                { count: disputes },
                { count: reports },
                { count: refunds }
            ] = await Promise.all([
                supabase.from('cases').select('*', { count: 'exact', head: true }).eq('status', 'new'),
                supabase.from('cases').select('*', { count: 'exact', head: true }).eq('type', 'dispute').eq('status', 'open'),
                supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('cases').select('*', { count: 'exact', head: true }).eq('type', 'refund').eq('status', 'open')
            ]);

            return {
                tickets: tickets || 0,
                disputes: disputes || 0,
                reports: reports || 0,
                refunds: refunds || 0
            };
        },
        refetchInterval: 30000 // Refetch every 30s
    });

    const kpis = [
        {
            label: "New Tickets",
            value: stats?.tickets ?? 0,
            icon: Ticket,
            color: "bg-emerald-500/10 text-emerald-500",
            border: "border-emerald-500/20"
        },
        {
            label: "Open Disputes",
            value: stats?.disputes ?? 0,
            icon: Gavel,
            color: "bg-rose-500/10 text-rose-500",
            border: "border-rose-500/20"
        },
        {
            label: "User Reports",
            value: stats?.reports ?? 0,
            icon: Flag,
            color: "bg-amber-500/10 text-amber-500",
            border: "border-amber-500/20"
        },
        {
            label: "Refund Requests",
            value: stats?.refunds ?? 0,
            icon: CreditCard,
            color: "bg-blue-500/10 text-blue-500",
            border: "border-blue-500/20"
        }
    ];

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="glass-card p-4 border border-border/50 h-32 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/20" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {kpis.map((kpi, i) => (
                <div
                    key={i}
                    className={cn(
                        "glass-card p-4 border transition-all hover:border-[#7c3aed]/50 group",
                        kpi.border
                    )}
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className={cn("p-2 rounded-xl transition-transform group-hover:scale-110", kpi.color)}>
                            <kpi.icon className="h-5 w-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-70">{kpi.label}</p>
                        <h3 className="text-3xl font-black mt-1 tracking-tighter text-white">{kpi.value}</h3>
                    </div>
                </div>
            ))}
        </div>
    );
}
