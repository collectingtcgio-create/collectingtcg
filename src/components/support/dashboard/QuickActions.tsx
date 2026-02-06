import { Zap, UserPlus, Server, ShieldAlert, History, Loader2, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function QuickActions() {
    return (
        <section className="space-y-6">
            <div className="glass-card p-6 border-border/50 bg-muted/5">
                <h3 className="font-bold text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-[#7c3aed]" />
                    Quick Actions
                </h3>
                <div className="grid grid-cols-1 gap-3">
                    <Button variant="outline" className="justify-start h-12 border-border/50 hover:bg-[#7c3aed]/10 group transition-all">
                        <UserPlus className="h-4 w-4 mr-3 text-muted-foreground group-hover:text-[#7c3aed]" />
                        <span className="text-xs font-bold">New Support Case</span>
                    </Button>
                    <Button variant="outline" className="justify-start h-12 border-border/50 hover:bg-rose-500/10 group transition-all">
                        <ShieldAlert className="h-4 w-4 mr-3 text-muted-foreground group-hover:text-rose-500" />
                        <span className="text-xs font-bold">Emergency Freeze</span>
                    </Button>
                    <Button variant="outline" className="justify-start h-12 border-border/50 hover:bg-blue-500/10 group transition-all">
                        <Server className="h-4 w-4 mr-3 text-muted-foreground group-hover:text-blue-500" />
                        <span className="text-xs font-bold">System Status</span>
                    </Button>
                </div>
            </div>

            <RecentActivity />
        </section>
    );
}

function RecentActivity() {
    const { data: logs, isLoading } = useQuery({
        queryKey: ['recent-support-logs'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('support_actions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) throw error;
            return data;
        }
    });

    if (isLoading) {
        return (
            <div className="glass-card p-6 border-border/50 min-h-[300px] flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/20" />
            </div>
        );
    }

    return (
        <div className="glass-card p-6 border-border/50 bg-muted/5">
            <h3 className="font-bold text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" />
                Recent Logs
            </h3>

            {(!logs || logs.length === 0) ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                    <History className="h-8 w-8 text-muted-foreground/20 mb-3" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">No recent activity</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {logs.map((log) => (
                        <div key={log.id} className="flex gap-4 relative">
                            <div className="mt-1 w-2 h-2 rounded-full bg-[#7c3aed] shrink-0 shadow-[0_0_8px_rgba(124,58,237,0.5)]" />
                            <div>
                                <p className="text-xs font-bold tracking-tight text-foreground/90">
                                    {(log.action_type as string).replace(/_/g, ' ')}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
