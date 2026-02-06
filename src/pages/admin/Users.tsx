import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
    Search,
    Filter,
    MoreVertical,
    ShieldAlert,
    UserPlus,
    Ban,
    Clock,
    AlertTriangle,
    History,
    MessageSquare,
    ShieldCheck,
    UserCheck,
    BanIcon,
    UserX,
    UserCog,
    ChevronDown
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { logAuditAction } from "@/lib/audit";
import { useAuth } from "@/hooks/useAuth";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function AdminUsers() {
    const { user: actor } = useAuth();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [actionType, setActionType] = useState<string | null>(null);
    const [actionReason, setActionReason] = useState("");
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<string>("user");

    // Fetch users with search
    const { data: users, isLoading } = useQuery({
        queryKey: ['admin-users', search],
        queryFn: async () => {
            let query = supabase
                .from('profiles')
                .select('*, user_roles!user_roles_user_id_profiles_fkey(role)')
                .order('created_at', { ascending: false });

            if (search) {
                query = query.or(`username.ilike.%${search}%,id.eq.${search}`);
            }

            const { data, error } = await query.limit(20);
            if (error) {
                console.error("Error fetching users:", error);
                toast.error(`Error loading users: ${error.message}`);
                throw error;
            }
            return data;
        }
    });

    // User Action Mutation
    const performAction = useMutation({
        mutationFn: async ({ userId, type, reason }: { userId: string, type: string, reason: string }) => {
            let updates: any = { admin_notes: reason };
            let auditType: any = 'user_warn';

            switch (type) {
                case 'warn':
                    // Incremental warning
                    const user = users?.find(u => u.id === userId);
                    updates.warnings_count = (user?.warnings_count || 0) + 1;
                    auditType = 'user_warned';
                    break;
                case 'restrict':
                    updates.is_restricted = true;
                    auditType = 'user_restricted';
                    break;
                case 'suspend':
                    updates.is_suspended = true;
                    auditType = 'user_suspended';
                    break;
                case 'ban':
                    updates.is_banned = true;
                    auditType = 'user_banned';
                    break;
                case 'unban':
                    updates.is_banned = false;
                    updates.is_suspended = false;
                    updates.is_restricted = false;
                    auditType = 'user_restored';
                    break;
            }

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', userId);

            if (error) throw error;

            // Log Audit Action
            await logAuditAction({
                actorId: actor?.id || '',
                actorRole: 'admin',
                actionType: auditType,
                targetType: 'user',
                targetId: userId,
                reason: reason
            });

            return { userId, type };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success(`User action processed successfully.`);
            setIsActionModalOpen(false);
            setActionReason("");
        },
        onError: (error) => {
            toast.error(`Failed to process action: ${error.message}`);
        }
    });

    // Role Change Mutation
    const changeRole = useMutation({
        mutationFn: async ({ userId, role }: { userId: string, role: string }) => {
            // Remove existing roles first
            const { error: deleteError } = await supabase
                .from('user_roles')
                .delete()
                .eq('user_id', userId);

            if (deleteError) throw deleteError;

            // If not setting back to 'user', add the new role
            if (role !== 'user') {
                const { error: insertError } = await supabase
                    .from('user_roles')
                    .insert({
                        user_id: userId,
                        role: role as any
                    });

                if (insertError) throw insertError;
            }

            // Log Audit Action
            await logAuditAction({
                actorId: actor?.id || '',
                actorRole: 'admin',
                actionType: 'user_role_changed',
                targetType: 'user',
                targetId: userId,
                reason: `Role changed to ${role}`
            });

            return { userId, role };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success(`User role updated successfully.`);
            setIsRoleModalOpen(false);
        },
        onError: (error) => {
            toast.error(`Failed to update role: ${error.message}`);
        }
    });

    const handleActionClick = (user: any, type: string) => {
        setSelectedUser(user);
        setActionType(type);
        setIsActionModalOpen(true);
    };

    const getStatusBadge = (user: any) => {
        const roles = user.user_roles?.map((r: any) => r.role) || [];
        const isAdmin = roles.includes('admin');
        const isSupport = roles.includes('support');

        return (
            <div className="flex flex-wrap gap-1">
                {user.is_banned && <Badge variant="destructive" className="bg-rose-900/50 text-rose-200 border-rose-500/30">Banned</Badge>}
                {user.is_suspended && <Badge variant="secondary" className="bg-amber-900/50 text-amber-200 border-amber-500/30">Suspended</Badge>}
                {user.is_restricted && <Badge variant="outline" className="text-amber-500 border-amber-500/30">Restricted</Badge>}
                {isAdmin && <Badge variant="outline" className="text-primary border-primary/30">Admin</Badge>}
                {isSupport && <Badge variant="outline" className="text-blue-400 border-blue-400/30">Support</Badge>}
                {!user.is_banned && !user.is_suspended && !user.is_restricted && roles.length === 0 && (
                    <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">Active</Badge>
                )}
            </div>
        );
    };

    return (
        <AdminLayout title="User Management">
            <div className="space-y-6">
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by username or ID..."
                            className="pl-10 bg-[#0c0c0e] border-border/40 focus:border-primary/50 transition-colors"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button variant="outline" size="sm" className="h-9 border-border/40 bg-[#0c0c0e] hover:bg-white/5">
                            <Filter className="w-4 h-4 mr-2" />
                            Filter
                        </Button>
                        <Button size="sm" className="h-9 bg-primary hover:bg-primary/90">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Invite User
                        </Button>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-[#0c0c0e] border border-border/40 rounded-xl overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-white/5">
                            <TableRow className="hover:bg-transparent border-border/40">
                                <TableHead className="w-[250px] font-semibold text-xs tracking-wider uppercase py-4">User</TableHead>
                                <TableHead className="font-semibold text-xs tracking-wider uppercase py-4">Status</TableHead>
                                <TableHead className="font-semibold text-xs tracking-wider uppercase py-4">Warnings</TableHead>
                                <TableHead className="font-semibold text-xs tracking-wider uppercase py-4">Joined</TableHead>
                                <TableHead className="text-right font-semibold text-xs tracking-wider uppercase py-4">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground animate-pulse">
                                        Scanning user database...
                                    </TableCell>
                                </TableRow>
                            ) : !users || users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">
                                        No users found matching your search.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((u) => (
                                    <TableRow key={u.id} className="hover:bg-white/5 border-border/40 group transition-colors">
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs shrink-0 overflow-hidden">
                                                    {u.avatar_url ? (
                                                        <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : u.username?.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-sm truncate">{u.username || 'Anonymous'}</p>
                                                    <p className="text-[10px] text-muted-foreground font-mono truncate">{u.id}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(u)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <span className={u.warnings_count > 0 ? "text-amber-500 font-bold" : "text-muted-foreground"}>
                                                    {u.warnings_count || 0}
                                                </span>
                                                {u.warnings_count > 2 && <ShieldAlert className="w-3 h-3 text-rose-500" />}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs italic">
                                            {new Date(u.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 text-muted-foreground">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 bg-[#0c0c0e] border-border/40">
                                                    <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Manage User</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleActionClick(u, 'warn')} className="text-amber-500 focus:text-amber-400">
                                                        <AlertTriangle className="mr-2 h-4 w-4" /> Warn User
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleActionClick(u, 'restrict')} className="text-amber-500 focus:text-amber-400">
                                                        <ShieldAlert className="mr-2 h-4 w-4" /> Restrict Access
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-border/40" />
                                                    <DropdownMenuItem onClick={() => handleActionClick(u, 'suspend')} className="text-rose-500 focus:text-rose-400">
                                                        <Clock className="mr-2 h-4 w-4" /> Suspend Account
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleActionClick(u, 'ban')} className="text-rose-600 focus:text-rose-500 font-bold">
                                                        <Ban className="mr-2 h-4 w-4" /> Ban Permanently
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-border/40" />
                                                    {(u.is_banned || u.is_suspended || u.is_restricted) && (
                                                        <DropdownMenuItem onClick={() => handleActionClick(u, 'unban')} className="text-emerald-500 focus:text-emerald-400">
                                                            <UserCheck className="mr-2 h-4 w-4" /> Restore Access
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedUser(u);
                                                            const currentRole = (u.user_roles as any)?.[0]?.role || 'user';
                                                            setSelectedRole(currentRole);
                                                            setIsRoleModalOpen(true);
                                                        }}
                                                        className="text-slate-300"
                                                    >
                                                        <UserCog className="mr-2 h-4 w-4" /> Change Role
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-border/40" />
                                                    <DropdownMenuItem className="text-slate-300">
                                                        <History className="mr-2 h-4 w-4" /> View Audit Trail
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Action Modal */}
                <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
                    <DialogContent className="bg-[#0c0c0e] border-border/40 text-slate-50 max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                {actionType === 'ban' && <BanIcon className="w-5 h-5 text-rose-500" />}
                                {actionType === 'warn' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                                Confirm {actionType?.toUpperCase()} Action
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                                You are about to perform a <strong>{actionType}</strong> action on user <strong>{selectedUser?.username}</strong>.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <MessageSquare className="w-3 h-3" />
                                    Reason / Internal Note
                                </label>
                                <Textarea
                                    placeholder="Describe the reason for this action... (Logged in Audit Trail)"
                                    className="bg-black/40 border-border/40 resize-none h-24 focus:border-primary/50"
                                    value={actionReason}
                                    onChange={(e) => setActionReason(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsActionModalOpen(false)} className="text-xs hover:bg-white/5">Cancel</Button>
                            <Button
                                variant={actionType === 'ban' || actionType === 'suspend' ? 'destructive' : 'default'}
                                className={actionType === 'warn' ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
                                disabled={!actionReason || performAction.isPending}
                                onClick={() => performAction.mutate({ userId: selectedUser.id, type: actionType!, reason: actionReason })}
                            >
                                {performAction.isPending ? "Processing..." : `Confirm ${actionType}`}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Role Change Modal */}
                <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
                    <DialogContent className="bg-[#0c0c0e] border-border/40 text-slate-50 max-w-sm">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <UserCog className="w-5 h-5 text-primary" />
                                Assign Platform Role
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                                Update system permissions for <strong>{selectedUser?.username}</strong>.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select Role</label>
                                <Select value={selectedRole} onValueChange={setSelectedRole}>
                                    <SelectTrigger className="bg-black/40 border-border/40 h-10">
                                        <SelectValue placeholder="Choose a role" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0c0c0e] border-border/40">
                                        <SelectItem value="user">User (Standard)</SelectItem>
                                        <SelectItem value="support">Support Agent</SelectItem>
                                        <SelectItem value="moderator">Moderator</SelectItem>
                                        <SelectItem value="admin" className="text-rose-400 font-bold focus:text-rose-300">Administrator</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                                <p className="text-[10px] text-amber-200/70 leading-relaxed italic">
                                    <AlertTriangle className="w-3 h-3 inline mr-1 mb-0.5" />
                                    Assigning 'Admin' or 'Support' roles grants access to the restricted Command Center and Admin Portal.
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsRoleModalOpen(false)} className="text-xs hover:bg-white/5">Cancel</Button>
                            <Button
                                className="bg-primary hover:bg-primary/90"
                                disabled={changeRole.isPending}
                                onClick={() => changeRole.mutate({ userId: selectedUser.user_id, role: selectedRole })}
                            >
                                {changeRole.isPending ? "Updating..." : "Update Role"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
