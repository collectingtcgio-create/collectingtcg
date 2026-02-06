import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
    Search,
    Filter,
    MoreVertical,
    ShoppingBag,
    Trash2,
    Snowflake,
    RefreshCcw,
    ExternalLink,
    MessageSquare,
    AlertTriangle,
    User,
    Image as ImageIcon
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

export default function AdminListings() {
    const { user: actor } = useAuth();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [selectedListing, setSelectedListing] = useState<any>(null);
    const [actionType, setActionType] = useState<string | null>(null);
    const [actionReason, setActionReason] = useState("");
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);

    // Fetch listings with search
    const { data: listings, isLoading } = useQuery({
        queryKey: ['admin-listings', search],
        queryFn: async () => {
            let query = (supabase
                .from('admin_listings_view' as any) as any)
                .select('*')
                .order('created_at', { ascending: false });

            if (search) {
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(search);
                if (isUuid) {
                    query = query.or(`id.eq.${search},seller_id.eq.${search}`);
                } else {
                    query = query.or(`card_name.ilike.%${search}%,seller_username.ilike.%${search}%`);
                }
            }

            const { data, error } = await query.limit(40);
            if (error) {
                console.error("Listing fetch error:", error);
                toast.error(`Error loading listings: ${error.message}`);
                throw error;
            }
            return data;
        }
    });

    // Listing Action Mutation
    const performAction = useMutation({
        mutationFn: async ({ listingId, type, reason }: { listingId: string, type: string, reason: string }) => {
            let updates: any = { admin_notes: reason };
            let auditType: any = 'listing_mod';

            switch (type) {
                case 'freeze':
                    updates.status = 'frozen';
                    auditType = 'listing_frozen';
                    break;
                case 'remove':
                    updates.status = 'cancelled';
                    auditType = 'listing_removed';
                    break;
                case 'restore':
                    updates.status = 'active';
                    auditType = 'listing_restored';
                    break;
            }

            const { error } = await supabase
                .from('marketplace_listings')
                .update(updates)
                .eq('id', listingId);

            if (error) throw error;

            // Log Audit Action
            await logAuditAction({
                actorId: actor?.id || '',
                actorRole: 'admin',
                actionType: auditType,
                targetType: 'listing',
                targetId: listingId,
                reason: reason
            });

            return { listingId, type };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-listings'] });
            toast.success(`Listing action processed successfully.`);
            setIsActionModalOpen(false);
            setActionReason("");
        },
        onError: (error) => {
            toast.error(`Failed to process action: ${error.message}`);
        }
    });

    const handleActionClick = (listing: any, type: string) => {
        setSelectedListing(listing);
        setActionType(type);
        setIsActionModalOpen(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">Active</Badge>;
            case 'sold': return <Badge variant="secondary" className="bg-blue-900/50 text-blue-200 border-blue-500/30">Sold</Badge>;
            case 'frozen': return <Badge variant="outline" className="text-amber-500 border-amber-500/30">Frozen</Badge>;
            case 'cancelled': return <Badge variant="destructive" className="bg-rose-900/50 text-rose-200 border-rose-500/30">Removed</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <AdminLayout title="Listing Moderation">
            <div className="space-y-6">
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search card, listing ID, seller ID or username..."
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
                    </div>
                </div>

                {/* Listings Table */}
                <div className="bg-[#0c0c0e] border border-border/40 rounded-xl overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-white/5">
                            <TableRow className="hover:bg-transparent border-border/40">
                                <TableHead className="w-[300px] font-semibold text-xs tracking-wider uppercase py-4">Listing</TableHead>
                                <TableHead className="font-semibold text-xs tracking-wider uppercase py-4">Seller</TableHead>
                                <TableHead className="font-semibold text-xs tracking-wider uppercase py-4">Price</TableHead>
                                <TableHead className="font-semibold text-xs tracking-wider uppercase py-4">Status</TableHead>
                                <TableHead className="text-right font-semibold text-xs tracking-wider uppercase py-4">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground animate-pulse">
                                        Scanning marketplace...
                                    </TableCell>
                                </TableRow>
                            ) : !listings || listings.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">
                                        No listings found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                listings.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-white/5 border-border/40 group transition-colors">
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-14 rounded bg-white/5 border border-border/40 flex items-center justify-center shrink-0 overflow-hidden relative group-hover:border-primary/30 transition-colors">
                                                    {item.image_url ? (
                                                        <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                                    ) : <ImageIcon className="w-4 h-4 text-muted-foreground" />}
                                                    <div className="absolute top-1 right-1">
                                                        <Badge className="text-[8px] px-1 h-3 bg-black/60 backdrop-blur-md border-none">{item.tcg_game}</Badge>
                                                    </div>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-sm truncate">{item.card_name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-mono truncate">{item.id}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <User className="w-3 h-3 text-muted-foreground" />
                                                <span className="text-sm">{(item as any).seller_username || 'Unknown'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">
                                            ${item.asking_price?.toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(item.status)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 text-muted-foreground">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 bg-[#0c0c0e] border-border/40">
                                                    <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Listing Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem className="text-slate-300">
                                                        <ExternalLink className="mr-2 h-4 w-4" /> View Public Page
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-border/40" />
                                                    <DropdownMenuItem onClick={() => handleActionClick(item, 'freeze')} className="text-amber-500 focus:text-amber-400">
                                                        <Snowflake className="mr-2 h-4 w-4" /> Freeze Listing
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleActionClick(item, 'remove')} className="text-rose-500 focus:text-rose-400">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Remove Listing
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-border/40" />
                                                    {(item.status === 'frozen' || item.status === 'cancelled') && (
                                                        <DropdownMenuItem onClick={() => handleActionClick(item, 'restore')} className="text-emerald-500 focus:text-emerald-400">
                                                            <RefreshCcw className="mr-2 h-4 w-4" /> Restore Listing
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem className="text-slate-300">
                                                        <MessageSquare className="mr-2 h-4 w-4" /> Contact Seller
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
                                {actionType === 'remove' && <Trash2 className="w-5 h-5 text-rose-500" />}
                                {actionType === 'freeze' && <Snowflake className="w-5 h-5 text-amber-500" />}
                                Confirm Listing Action
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                                Confirming <strong>{actionType}</strong> for <strong>{selectedListing?.card_name}</strong>.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <MessageSquare className="w-3 h-3" />
                                    Reason / Internal Note
                                </label>
                                <Textarea
                                    placeholder="Reason for moderation action..."
                                    className="bg-black/40 border-border/40 resize-none h-24 focus:border-primary/50"
                                    value={actionReason}
                                    onChange={(e) => setActionReason(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsActionModalOpen(false)} className="text-xs hover:bg-white/5">Cancel</Button>
                            <Button
                                variant={actionType === 'remove' ? 'destructive' : 'default'}
                                className={actionType === 'freeze' ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
                                disabled={!actionReason || performAction.isPending}
                                onClick={() => performAction.mutate({ listingId: selectedListing.id, type: actionType!, reason: actionReason })}
                            >
                                {performAction.isPending ? "Processing..." : `Confirm ${actionType}`}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
