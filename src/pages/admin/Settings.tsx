import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
    Settings as SettingsIcon,
    Shield,
    Clock,
    MessageSquare,
    Save,
    RefreshCcw,
    AlertTriangle,
    Lock,
    Globe,
    Bell
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { logAuditAction } from "@/lib/audit";
import { useAuth } from "@/hooks/useAuth";

export default function AdminSettings() {
    const { user: actor } = useAuth();
    const queryClient = useQueryClient();
    const [editedSettings, setEditedSettings] = useState<Record<string, any>>({});

    // Fetch all system settings
    const { data: settings, isLoading } = useQuery({
        queryKey: ['admin-system-settings'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('system_settings')
                .select('*');

            if (error) throw error;
            return data;
        }
    });

    // Update Setting Mutation
    const updateSetting = useMutation({
        mutationFn: async ({ key, value }: { key: string, value: any }) => {
            const { error } = await supabase
                .from('system_settings')
                .update({ value, updated_at: new Date().toISOString() })
                .eq('key', key);

            if (error) throw error;

            await logAuditAction({
                actorId: actor?.id || '',
                actorRole: 'admin',
                actionType: 'setting_updated',
                targetType: 'system',
                targetId: key,
                reason: `Setting ${key} updated to ${JSON.stringify(value)}`
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-system-settings'] });
            toast.success("Settings updated successfully.");
            setEditedSettings({});
        }
    });

    const handleInputChange = (key: string, value: any) => {
        setEditedSettings(prev => ({ ...prev, [key]: value }));
    };

    const saveChanges = () => {
        Object.entries(editedSettings).forEach(([key, value]) => {
            updateSetting.mutate({ key, value });
        });
    };

    const hasChanges = Object.keys(editedSettings).length > 0;

    return (
        <AdminLayout title="System Settings">
            <div className="space-y-8 max-w-4xl">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Global Configurations</h2>
                        <p className="text-sm text-muted-foreground">Manage marketplace rules and system thresholds.</p>
                    </div>
                    {hasChanges && (
                        <div className="flex gap-2 animate-in fade-in slide-in-from-right-4">
                            <Button variant="ghost" size="sm" onClick={() => setEditedSettings({})}>Discard</Button>
                            <Button size="sm" onClick={saveChanges} disabled={updateSetting.isPending}>
                                <Save className="w-4 h-4 mr-2" />
                                {updateSetting.isPending ? "Saving..." : "Save All Changes"}
                            </Button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {/* Marketplace Policies */}
                    <Card className="bg-[#0c0c0e] border-border/40 shadow-sm overflow-hidden">
                        <CardHeader className="bg-white/5 border-b border-border/40">
                            <div className="flex items-center gap-2">
                                <Globe className="w-5 h-5 text-primary" />
                                <CardTitle>Marketplace Policies</CardTitle>
                            </div>
                            <CardDescription>Rules governing transactions and disputes.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {isLoading ? (
                                <div className="py-8 text-center text-muted-foreground animate-pulse">Loading settings...</div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-semibold">Dispute Window (Days)</Label>
                                            <p className="text-xs text-muted-foreground">Timeframe for buyers to open a dispute after delivery.</p>
                                        </div>
                                        <div className="w-24">
                                            <Input
                                                type="number"
                                                value={editedSettings['dispute_window_days'] ?? settings?.find(s => s.key === 'dispute_window_days')?.value ?? 7}
                                                className="bg-black/40 border-border/40 text-right h-8"
                                                onChange={(e) => handleInputChange('dispute_window_days', parseInt(e.target.value))}
                                            />
                                        </div>
                                    </div>

                                    <Separator className="bg-border/40" />

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-semibold">Auto-Escalate Threshold (Reports)</Label>
                                            <p className="text-xs text-muted-foreground">Number of reports before an account is auto-flagged for review.</p>
                                        </div>
                                        <div className="w-24">
                                            <Input
                                                type="number"
                                                value={editedSettings['auto_escalate_report_threshold'] ?? settings?.find(s => s.key === 'auto_escalate_report_threshold')?.value ?? 5}
                                                className="bg-black/40 border-border/40 text-right h-8"
                                                onChange={(e) => handleInputChange('auto_escalate_report_threshold', parseInt(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* System Security */}
                    <Card className="bg-[#0c0c0e] border-border/40 shadow-sm overflow-hidden opacity-80 grayscale pointer-events-none">
                        <CardHeader className="bg-white/5 border-b border-border/40">
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-rose-500" />
                                <CardTitle>System Security</CardTitle>
                                <Badge variant="outline" className="text-[8px] h-4 uppercase border-rose-500/30 text-rose-500">Coming Soon</Badge>
                            </div>
                            <CardDescription>Emergency lockdowns and staff permission levels.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Marketplace Freeze</Label>
                                    <p className="text-xs text-muted-foreground">Immediately disable all listing and buying activity.</p>
                                </div>
                                <Switch disabled />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Strict Login Requirements</Label>
                                    <p className="text-xs text-muted-foreground">Force 2FA for all accounts with 'admin' or 'support' roles.</p>
                                </div>
                                <Switch checked disabled />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Admin Tools */}
                    <Card className="border-border/40 bg-[#0c0c0e]/50">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm">Clear System Cache</h4>
                                    <p className="text-xs text-muted-foreground">Refresh all static assets and configuration states.</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="h-8 text-xs border-amber-500/20 text-amber-500 hover:bg-amber-500/10">
                                <RefreshCcw className="w-4 h-4 mr-2" />
                                Purge Cache
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
