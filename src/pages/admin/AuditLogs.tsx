import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
    Search,
    Filter,
    Calendar,
    User,
    ShieldCheck,
    Ban,
    AlertTriangle,
    RefreshCcw,
    Clock,
    ExternalLink,
    ChevronDown
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function AdminAuditLogs() {
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState<string | null>(null);

    // Fetch audit logs
    const { data: logs, isLoading } = useQuery({
        queryKey: ['admin-audit-logs', search, filterType],
        queryFn: async () => {
            let query = supabase
                .from('audit_logs')
                .select(`
          *,
          actor:profiles!audit_logs_actor_id_fkey(username)
        `)
                .order('created_at', { ascending: false });

            if (search) {
                query = query.or(`reason.ilike.%${search}%,target_id.eq.${search}`);
            }

            if (filterType) {
                query = query.eq('action_type', filterType);
            }

            const { data, error } = await query.limit(50);
            if (error) throw error;
            return data;
        }
    });

    const getActionIcon = (type: string) => {
        if (type.includes('ban')) return <Ban className="w-4 h-4 text-rose-500" />;
        if (type.includes('warn') || type.includes('restrict')) return <AlertTriangle className="w-4 h-4 text-amber-500" />;
        if (type.includes('restore') || type.includes('unban')) return <RefreshCcw className="w-4 h-4 text-emerald-500" />;
        if (type.includes('freeze')) return <Clock className="w-4 h-4 text-blue-500" />;
        return <ShieldCheck className="w-4 h-4 text-primary" />;
    };

    return (
        <AdminLayout title="Audit Trail">
            <div className="space-y-6">
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search logs by reason or ID..."
                            className="pl-10 bg-[#0c0c0e] border-border/40 focus:border-primary/50 transition-colors"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <Button variant="outline" size="sm" className="h-9 border-border/40 bg-[#0c0c0e] hover:bg-white/5 gap-2">
                            <Calendar className="w-4 h-4" />
                            Timeframe
                            <ChevronDown className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-9 border-border/40 bg-[#0c0c0e] hover:bg-white/5 gap-2">
                            <Filter className="w-4 h-4" />
                            Action Type
                            <ChevronDown className="w-3 h-3" />
                        </Button>
                    </div>
                </div>

                {/* Audit Table */}
                <div className="bg-[#0c0c0e] border border-border/40 rounded-xl overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-white/5">
                            <TableRow className="hover:bg-transparent border-border/40">
                                <TableHead className="w-[180px] font-semibold text-xs tracking-wider uppercase py-4">Timestamp</TableHead>
                                <TableHead className="w-[150px] font-semibold text-xs tracking-wider uppercase py-4">Actor</TableHead>
                                <TableHead className="w-[150px] font-semibold text-xs tracking-wider uppercase py-4">Action</TableHead>
                                <TableHead className="font-semibold text-xs tracking-wider uppercase py-4">Details / Reason</TableHead>
                                <TableHead className="w-[150px] font-semibold text-xs tracking-wider uppercase py-4">Target</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground animate-pulse">
                                        Retrieving encrypted logs...
                                    </TableCell>
                                </TableRow>
                            ) : !logs || logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">
                                        No matching audit records found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id} className="hover:bg-white/5 border-border/40 group transition-colors">
                                        <TableCell className="text-muted-foreground text-[10px] font-mono whitespace-nowrap">
                                            {new Date(log.created_at || '').toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                                    {log.actor?.username?.charAt(0).toUpperCase() || 'S'}
                                                </div>
                                                <span className="text-sm font-medium">{log.actor?.username || 'System'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getActionIcon(log.action_type)}
                                                <span className="text-xs font-semibold capitalize">{log.action_type.replace(/_/g, ' ')}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-md">
                                            <p className="text-sm text-slate-300 line-clamp-1 group-hover:line-clamp-none transition-all duration-300">
                                                {log.reason || 'No description provided.'}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[9px] uppercase tracking-tighter h-4 px-1.5 bg-white/5 border-white/10 text-muted-foreground">
                                                    {log.target_type}
                                                </Badge>
                                                <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[80px]">{log.target_id}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AdminLayout>
    );
}
