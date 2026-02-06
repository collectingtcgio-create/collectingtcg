import { SupportLayout } from "@/components/support/SupportLayout";
import { KpiCards } from "@/components/support/dashboard/KpiCards";
import { PriorityQueue } from "@/components/support/dashboard/PriorityQueue";
import { QuickActions } from "@/components/support/dashboard/QuickActions";
import { Search, ChevronRight, MessageSquareQuote, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export default function SupportConsole() {
    return (
        <SupportLayout>
            <div className="space-y-8">
                {/* KPI Section */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">Command Center</h2>
                            <p className="text-xs text-muted-foreground mt-1 font-medium">Real-time platform oversight & moderation</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="h-6 border-[#7c3aed]/30 text-[#7c3aed] bg-[#7c3aed]/5 font-black text-[10px] uppercase tracking-widest px-3">
                                Live Feed
                            </Badge>
                        </div>
                    </div>
                    <KpiCards />
                </section>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left/Center Column (2/3 width) */}
                    <div className="lg:col-span-2 space-y-8">
                        <section>
                            <PriorityQueue />
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Saved Replies Snippet */}
                            <section className="glass-card p-6 border-border/50 bg-muted/5 group">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <MessageSquareQuote className="h-4 w-4 text-[#7c3aed]" />
                                        <h3 className="font-bold text-xs uppercase tracking-widest">Saved Replies</h3>
                                    </div>
                                    <Link to="/support/replies">
                                        <Button variant="ghost" size="sm" className="text-[10px] font-bold text-[#7c3aed] hover:bg-[#7c3aed]/10">
                                            Manage
                                        </Button>
                                    </Link>
                                </div>
                                <div className="space-y-3 opacity-30 select-none pointer-events-none">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="p-3 rounded-xl border border-dashed border-border/50">
                                            <div className="w-16 h-2 bg-muted rounded mb-2" />
                                            <div className="w-full h-2 bg-muted/50 rounded" />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 p-3 bg-[#7c3aed]/5 border border-[#7c3aed]/10 rounded-xl text-center">
                                    <p className="text-[10px] font-bold text-[#7c3aed] uppercase tracking-widest">No templates created</p>
                                </div>
                            </section>

                            {/* Recent Activity Mini Feed */}
                            <section className="glass-card p-6 border-border/50 bg-muted/5">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <History className="h-4 w-4 text-emerald-500" />
                                        <h3 className="font-bold text-xs uppercase tracking-widest">Active Agents</h3>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-[10px] font-bold text-muted-foreground">
                                        Refresh
                                    </Button>
                                </div>
                                <div className="flex flex-col items-center justify-center py-6 text-center opacity-40">
                                    <p className="text-[10px] font-bold uppercase tracking-widest">System quiet</p>
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Right Column (1/3 width) */}
                    <div className="lg:col-span-1">
                        <QuickActions />
                    </div>
                </div>
            </div>
        </SupportLayout>
    );
}


