import { useState } from "react";
import { SupportLayout } from "@/components/support/SupportLayout";
import { Search, User, Mail, Shield, AlertTriangle, Key, Loader2, History, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function SupportUsers() {
    const [searchQuery, setSearchQuery] = useState("");
    const { toast } = useToast();

    const { data: users, isLoading } = useQuery({
        queryKey: ['support-users', searchQuery],
        queryFn: async () => {
            let query = supabase
                .from('profiles')
                .select('*')
                .limit(10);

            if (searchQuery) {
                query = query.or(`username.ilike.%${searchQuery}%,id.eq.${searchQuery}`);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        },
        enabled: searchQuery.length >= 2 || searchQuery.length === 0
    });

    return (
        <SupportLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">Global Registry</h1>
                    <p className="text-xs text-muted-foreground mt-1 font-medium italic">Identity verification & community management</p>
                </div>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[#7c3aed] transition-colors" />
                    <input
                        type="text"
                        placeholder="Search users by username, email, or UUID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-muted/10 border-border/50 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#7c3aed] transition-all"
                    />
                </div>

                {isLoading ? (
                    <div className="glass-card p-24 flex flex-col items-center justify-center border-border/50">
                        <Loader2 className="h-10 w-10 animate-spin text-[#7c3aed] mb-4 opacity-50" />
                        <p className="text-sm font-bold uppercase tracking-widest opacity-30 animate-pulse">Accessing directory...</p>
                    </div>
                ) : (!users || users.length === 0) ? (
                    <div className="glass-card p-24 flex flex-col items-center justify-center text-center space-y-4 border-dashed border-2 border-border/30 bg-muted/5">
                        <div className="w-16 h-16 rounded-3xl bg-muted/20 flex items-center justify-center">
                            <User className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground/50">No users found</h3>
                            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                                We couldn't find any accounts matching your search criteria.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {users.map((u) => (
                            <div key={u.id} className="glass-card p-6 border-border/50 flex flex-col gap-6 hover:bg-[#7c3aed]/5 transition-all group overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="text-[10px] font-mono text-[#7c3aed] bg-[#7c3aed]/10 px-2 py-0.5 rounded">ID: {u.id.slice(0, 8)}</div>
                                </div>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-5">
                                        <Avatar className="h-16 w-16 ring-4 ring-border/20 group-hover:ring-[#7c3aed]/30 transition-all shadow-xl">
                                            <AvatarImage src={u.avatar_url} />
                                            <AvatarFallback className="bg-muted text-xl font-bold">{u.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="text-2xl font-black tracking-tighter uppercase">{u.username || 'Anonymous'}</h3>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 font-medium">
                                                <Mail className="h-3.5 w-3.5 text-[#7c3aed]" />
                                                {u.email_contact || 'No email synced'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                            Verified Account
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-bold opacity-30 uppercase tracking-widest">Type: Collector</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-2">
                                    <Button variant="outline" size="sm" className="h-10 border-border/50 bg-background hover:bg-white/5 text-[10px] font-black uppercase tracking-widest">
                                        <History className="h-4 w-4 mr-2" />
                                        Activity Log
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-10 border-border/50 bg-background hover:bg-white/5 text-[10px] font-black uppercase tracking-widest">
                                        <Shield className="h-4 w-4 mr-2" />
                                        Roles
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-10 border-border/50 bg-background hover:bg-amber-500/10 hover:text-amber-500 text-[10px] font-black uppercase tracking-widest transition-colors col-span-2"
                                    >
                                        <Key className="h-4 w-4 mr-2" />
                                        Reset Password Securely
                                    </Button>
                                </div>

                                <Button className="w-full bg-[#7c3aed] hover:bg-[#7c3aed]/90 text-white font-black text-[10px] uppercase tracking-[0.2em] h-11 shadow-lg shadow-[#7c3aed]/30 border-none">
                                    Freeze Permissions
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </SupportLayout>
    );
}
