import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
    Users,
    ShoppingBag,
    AlertTriangle,
    Clock,
    TrendingUp,
    FileSearch,
    ChevronRight,
    ShieldAlert
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function AdminOverview() {
    const navigate = useNavigate();

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            // New Users (24h)
            const { count: newUsers } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

            // Active Listings
            const { count: activeListings } = await supabase
                .from('marketplace_listings')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');

            // Open Disputes
            const { count: openDisputes } = await supabase
                .from('cases')
                .select('*', { count: 'exact', head: true })
                .eq('type', 'dispute')
                .neq('status', 'closed');

            // Escalated Cases
            const { count: escalatedCases } = await supabase
                .from('cases')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'escalated');

            // Pending Reports
            const { count: pendingReports } = await supabase
                .from('reports')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            return {
                newUsers: newUsers || 0,
                activeListings: activeListings || 0,
                openDisputes: openDisputes || 0,
                escalatedCases: escalatedCases || 0,
                pendingReports: pendingReports || 0
            };
        }
    });

    const { data: escalations, isLoading: escalationsLoading } = useQuery({
        queryKey: ['admin-escalations'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cases')
                .select('*, profiles(username)')
                .eq('status', 'escalated')
                .order('created_at', { ascending: true })
                .limit(5);

            if (error) throw error;
            return data;
        }
    });

    const { data: alerts, isLoading: alertsLoading } = useQuery({
        queryKey: ['admin-alerts'],
        queryFn: async () => {
            // Simple alert logic: fetch users with > 3 reports
            const { data, error } = await supabase
                .from('reports')
                .select('reported_user_id, profiles!reports_reported_user_id_fkey(username)')
                .eq('status', 'pending');

            if (error) throw error;

            // Count reports per user
            const userReportCounts = data.reduce((acc: any, report: any) => {
                const userId = report.reported_user_id;
                if (!userId) return acc;
                acc[userId] = acc[userId] || { id: userId, username: report.profiles?.username, count: 0 };
                acc[userId].count++;
                return acc;
            }, {});

            return Object.values(userReportCounts)
                .filter((u: any) => u.count >= 2) // Threshold
                .sort((a: any, b: any) => b.count - a.count);
        }
    });

    const kpis = [
        { title: "New Users (24h)", value: stats?.newUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
        { title: "Active Listings", value: stats?.activeListings, icon: ShoppingBag, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { title: "Open Disputes", value: stats?.openDisputes, icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
        { title: "Escalated Cases", value: stats?.escalatedCases, icon: ShieldAlert, color: "text-rose-500", bg: "bg-rose-500/10" },
        { title: "Reports Pending", value: stats?.pendingReports, icon: Clock, color: "text-purple-500", bg: "bg-purple-500/10" },
    ];

    return (
        <AdminLayout title="Overview">
            <div className="space-y-8">
                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {kpis.map((kpi, i) => (
                        <Card key={i} className="bg-[#0c0c0e] border-border/40 shadow-none hover:border-primary/30 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    {kpi.title}
                                </CardTitle>
                                <div className={cn("p-2 rounded-lg", kpi.bg)}>
                                    <kpi.icon className={cn("w-4 h-4", kpi.color)} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {statsLoading ? "..." : kpi.value}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Escalation Queue */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-rose-500" />
                                Escalation Queue
                            </h2>
                            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/admin/escalations')}>
                                View All <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>

                        <div className="bg-[#0c0c0e] border border-border/40 rounded-xl overflow-hidden">
                            <div className="divide-y divide-border/40">
                                {escalationsLoading ? (
                                    <div className="p-12 text-center text-muted-foreground animate-pulse">Loading queue...</div>
                                ) : !escalations || escalations.length === 0 ? (
                                    <div className="p-12 text-center text-muted-foreground italic">No escalated cases currently.</div>
                                ) : (
                                    escalations.map((item: any) => (
                                        <div key={item.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                                                    <ShieldAlert className="w-5 h-5 text-rose-500" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm group-hover:text-primary transition-colors">{item.subject}</p>
                                                    <p className="text-xs text-muted-foreground">User: {item.profiles?.username || 'Unknown'} • Type: {item.type}</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="text-[10px] font-bold uppercase tracking-widest h-8"
                                                onClick={() => navigate(`/admin/escalations?caseId=${item.id}`)}
                                            >
                                                Open Case
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Critical Alerts */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-amber-500" />
                            Critical Alerts
                        </h2>

                        <div className="bg-[#0c0c0e] border border-border/40 rounded-xl p-4 space-y-4">
                            {alertsLoading ? (
                                <div className="text-center py-8 text-muted-foreground animate-pulse">Checking records...</div>
                            ) : !alerts || alerts.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground italic text-sm">No critical alerts detected.</div>
                            ) : (
                                alerts.map((alert: any) => (
                                    <div key={alert.id} className="p-3 bg-white/5 rounded-lg border border-border/40 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold">{alert.username}</p>
                                            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">{alert.count} Pending Reports</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-[9px] font-bold uppercase border-amber-500/20 text-amber-500 hover:bg-amber-500/10"
                                            onClick={() => navigate(`/admin/users?search=${alert.username}`)}
                                        >
                                            Review
                                        </Button>
                                    </div>
                                ))
                            )}

                            <div className="pt-2">
                                <Button
                                    variant="ghost"
                                    className="w-full text-xs text-muted-foreground justify-between group"
                                    onClick={() => navigate('/admin/audit-logs')}
                                >
                                    View System History
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
