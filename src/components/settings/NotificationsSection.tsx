import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Bell, ShoppingBag, MessageSquare, Star, UserPlus } from "lucide-react";

interface NotificationSettings {
  email_sales: boolean;
  email_messages: boolean;
  email_reviews: boolean;
  email_friend_requests: boolean;
  in_app_sales: boolean;
  in_app_messages: boolean;
  in_app_reviews: boolean;
  in_app_friend_requests: boolean;
}

const defaultSettings: NotificationSettings = {
  email_sales: true,
  email_messages: true,
  email_reviews: true,
  email_friend_requests: true,
  in_app_sales: true,
  in_app_messages: true,
  in_app_reviews: true,
  in_app_friend_requests: true,
};

export function NotificationsSection() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.id) {
      loadSettings();
    }
  }, [profile?.id]);

  const loadSettings = async () => {
    if (!profile?.id) return;

    try {
      // For now, use localStorage since we don't have a notification_settings table
      const stored = localStorage.getItem(`notification_settings_${profile.id}`);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load notification settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    if (!profile?.id) return;

    setSaving(key);
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      // Store in localStorage for now
      localStorage.setItem(`notification_settings_${profile.id}`, JSON.stringify(newSettings));
      
      toast({
        title: "Settings updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error: any) {
      // Revert on error
      setSettings(settings);
      toast({
        title: "Failed to update",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const notificationTypes = [
    {
      key: "sales",
      label: "Sales & Purchases",
      description: "Notifications about your marketplace activity",
      icon: ShoppingBag,
      emailKey: "email_sales" as keyof NotificationSettings,
      inAppKey: "in_app_sales" as keyof NotificationSettings,
    },
    {
      key: "messages",
      label: "Messages",
      description: "New direct messages and replies",
      icon: MessageSquare,
      emailKey: "email_messages" as keyof NotificationSettings,
      inAppKey: "in_app_messages" as keyof NotificationSettings,
    },
    {
      key: "reviews",
      label: "Reviews",
      description: "Reviews and ratings on your listings",
      icon: Star,
      emailKey: "email_reviews" as keyof NotificationSettings,
      inAppKey: "in_app_reviews" as keyof NotificationSettings,
    },
    {
      key: "friend_requests",
      label: "Friend Requests",
      description: "New friend and follow requests",
      icon: UserPlus,
      emailKey: "email_friend_requests" as keyof NotificationSettings,
      inAppKey: "in_app_friend_requests" as keyof NotificationSettings,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Headers */}
      <div className="flex items-center gap-4 pb-2 border-b border-border/50">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">Notification Type</p>
        </div>
        <div className="w-20 text-center">
          <p className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-1">
            <Mail className="w-4 h-4" />
            Email
          </p>
        </div>
        <div className="w-20 text-center">
          <p className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-1">
            <Bell className="w-4 h-4" />
            In-App
          </p>
        </div>
      </div>

      {/* Notification Types */}
      {notificationTypes.map((type) => {
        const Icon = type.icon;
        return (
          <div key={type.key} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-primary" />
                <Label className="font-medium">{type.label}</Label>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {type.description}
              </p>
            </div>
            <div className="w-20 flex justify-center">
              <Switch
                checked={settings[type.emailKey]}
                onCheckedChange={(checked) => updateSetting(type.emailKey, checked)}
                disabled={saving === type.emailKey}
              />
            </div>
            <div className="w-20 flex justify-center">
              <Switch
                checked={settings[type.inAppKey]}
                onCheckedChange={(checked) => updateSetting(type.inAppKey, checked)}
                disabled={saving === type.inAppKey}
              />
            </div>
          </div>
        );
      })}

      <p className="text-xs text-muted-foreground mt-4">
        Note: Email notifications require a verified email address. Some critical notifications cannot be disabled.
      </p>
    </div>
  );
}