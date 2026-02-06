import { useState } from "react";
import { SupportLayout } from "@/components/support/SupportLayout";
import { Search, Plus, MessageSquareQuote, Copy, Edit2, Trash2, Search as SearchIcon, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export default function SavedReplies() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");

    const { data: replies, isLoading } = useQuery({
        queryKey: ['saved-replies', searchQuery],
        queryFn: async () => {
            let query = supabase
                .from('saved_replies')
                .select('*')
                .order('title', { ascending: true });

            if (searchQuery) {
                query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        }
    });

    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content);
        toast({
            title: "Copied to clipboard",
            description: "Template content is ready to be used in a case.",
        });
    };

    return (
        <SupportLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">Response Library</h1>
                        <p className="text-xs text-muted-foreground mt-1 font-medium italic">Standardized communication templates for efficiency</p>
                    </div>
                    <Button className="h-10 bg-[#7c3aed] hover:bg-[#7c3aed]/90 text-white font-black text-[10px] uppercase tracking-widest px-6 shadow-lg shadow-[#7c3aed]/20">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Template
                    </Button>
                </div>

                <div className="relative group">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[#7c3aed] transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by title, keywords, or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-muted/10 border-border/50 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#7c3aed] transition-all"
                    />
                </div>

                {isLoading ? (
                    <div className="glass-card p-24 flex flex-col items-center justify-center border-border/50">
                        <Loader2 className="h-10 w-10 animate-spin text-[#7c3aed] mb-4 opacity-50" />
                        <p className="text-sm font-bold uppercase tracking-widest opacity-30 animate-pulse">Syncing library...</p>
                    </div>
                ) : (!replies || replies.length === 0) ? (
                    <div className="glass-card p-24 flex flex-col items-center justify-center text-center space-y-4 border-dashed border-2 border-border/30 bg-muted/5">
                        <div className="w-16 h-16 rounded-3xl bg-muted/20 flex items-center justify-center border border-dashed border-border/50">
                            <MessageSquareQuote className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground/50">Library is empty</h3>
                            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                                Start creating templates to speed up your support workflows.
                            </p>
                        </div>
                        <Button variant="outline" className="h-10 border-[#7c3aed]/30 text-[#7c3aed] bg-[#7c3aed]/5 text-[10px] font-black uppercase tracking-widest hover:bg-[#7c3aed]/10">
                            <Sparkles className="h-4 w-4 mr-2" />
                            Use AI Suggestion
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {replies.map((reply) => (
                            <div key={reply.id} className="glass-card p-6 border-border/50 flex flex-col gap-5 group hover:bg-[#7c3aed]/5 transition-all relative">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h3 className="font-black text-sm uppercase tracking-tight text-foreground group-hover:text-[#7c3aed] transition-colors">
                                            {reply.title}
                                        </h3>
                                        <div className="inline-flex px-2 py-0.5 rounded-lg bg-[#7c3aed]/10 border border-[#7c3aed]/20">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-[#7c3aed]">
                                                {reply.category}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white" onClick={() => handleCopy(reply.content)}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-[#7c3aed]">
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="bg-muted/10 rounded-xl p-4 border border-border/30 italic">
                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
                                        "{reply.content}"
                                    </p>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-[10px] font-black uppercase tracking-widest text-[#7c3aed] border-[#7c3aed]/10 hover:bg-[#7c3aed]/10 hover:border-[#7c3aed]/30 h-10 transition-all active:scale-95"
                                    onClick={() => handleCopy(reply.content)}
                                >
                                    Copy Template
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </SupportLayout>
    );
}
