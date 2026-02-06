import { SupportLayout } from "@/components/support/SupportLayout";
import { Flag, ShieldAlert, EyeOff, MessageSquare, AlertTriangle, ExternalLink, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function SupportReports() {
    const { data: reports, isLoading } = useQuery({
        queryKey: ['support-reports'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        }
    });

    return (
        <SupportLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">Reports Pipeline</h1>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Review and moderate community flags and system alerts</p>
                </div>

                {isLoading ? (
                    <div className="glass-card p-24 flex flex-col items-center justify-center border-border/50">
                        <Loader2 className="h-10 w-10 animate-spin text-[#7c3aed] mb-4 opacity-50" />
                        <p className="text-sm font-bold uppercase tracking-widest opacity-30 animate-pulse">Scanning reports...</p>
                    </div>
                ) : (!reports || reports.length === 0) ? (
                    <div className="glass-card p-24 flex flex-col items-center justify-center text-center space-y-4 border-dashed border-2 border-border/30 bg-muted/5">
                        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <Flag className="h-8 w-8 text-emerald-500/30" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground/50">Great news: All clear!</h3>
                            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                                No active community reports or system flags require attention at this time.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {reports.map((report) => (
                            <div key={report.id} className="glass-card p-6 border-border/50 flex flex-col md:flex-row gap-8 hover:bg-[#7c3aed]/5 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#7c3aed]/5 to-transparent -mr-12 -mt-12 rounded-full group-hover:bg-[#7c3aed]/10 transition-colors" />

                                <div className="flex-shrink-0 relative">
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
                                        report.type === "User" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                    )}>
                                        {report.type === "User" ? <User className="h-7 w-7" /> : <Flag className="h-7 w-7" />}
                                    </div>
                                </div>

                                <div className="flex-1 space-y-3 relative">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest border-border/30 px-2 py-0 h-5 bg-background">
                                                {report.type} Action
                                            </Badge>
                                            <span className="text-[10px] font-mono text-muted-foreground bg-muted/30 px-2 py-0.5 rounded opacity-60">
                                                {report.id.slice(0, 8)}
                                            </span>
                                            <span className="text-[10px] text-[#7c3aed] font-bold uppercase tracking-tight">• {new Date(report.created_at).toLocaleTimeString()}</span>
                                        </div>
                                        <div className={cn(
                                            "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm",
                                            report.status === "pending" ? "bg-amber-500/10 text-amber-500 border-amber-500/30" : "bg-blue-500/10 text-blue-500 border-blue-500/30"
                                        )}>
                                            {report.status}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-black text-foreground flex items-center gap-3 tracking-tighter">
                                        {report.type === "User" ? "Reported User" : "Suspicious Listing"}
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-[#7c3aed] hover:bg-[#7c3aed]/10 rounded-lg">
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </Button>
                                    </h3>

                                    <div className="flex flex-col gap-2 p-3 bg-muted/20 border border-border/30 rounded-xl">
                                        <p className="text-sm text-foreground/80 flex items-center gap-2 font-medium">
                                            <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                                            <span className="text-muted-foreground">Reason:</span> {report.reason}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-row md:flex-col justify-end gap-2 shrink-0 relative mt-4 md:mt-0">
                                    <Button variant="outline" size="sm" className="h-10 border-border/50 bg-background hover:bg-white/5 text-[10px] font-black uppercase tracking-widest">
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Notes
                                    </Button>
                                    <Button size="sm" className="h-10 bg-[#7c3aed] hover:bg-[#7c3aed]/90 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#7c3aed]/20">
                                        Investigate
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </SupportLayout>
    );
}
