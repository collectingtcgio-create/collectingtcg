import { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useUserSettings } from "@/hooks/useUserSettings";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UsernameEditor } from "@/components/profile/UsernameEditor";
import { PrivacySettingsSection } from "@/components/settings/PrivacySettingsSection";
import { FriendsFollowersSection } from "@/components/settings/FriendsFollowersSection";
import { 
  Settings as SettingsIcon, 
  Shield, 
  MessageCircle, 
  Ban,
  Loader2,
  UserX,
  ArrowLeft,
  User,
  Users,
  Eye
} from "lucide-react";

interface ProfileWithUsernameChange {
  id: string;
  username: string;
  last_username_change_at: string | null;
}

export default function Settings() {
  const { user, profile } = useAuth();
  const { settings, blockedUsers, isLoading, updatePrivacy, unblockUser } = useUserSettings();
  const [profileData, setProfileData] = useState<ProfileWithUsernameChange | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchProfileData();
    }
  }, [profile]);

  const fetchProfileData = async () => {
    if (!profile) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("id, username, last_username_change_at")
      .eq("id", profile.id)
      .single();
    
    if (data) {
      setProfileData(data as ProfileWithUsernameChange);
    }
    setLoadingProfile(false);
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isLoading || loadingProfile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <Link to="/profile" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your account preferences
          </p>
        </div>

        {/* Account Settings */}
        <div className="glass-card neon-border-magenta overflow-hidden mb-6">
          <div className="bg-secondary/20 px-4 py-3 border-b border-border/50">
            <h2 className="font-semibold flex items-center gap-2">
              <User className="w-5 h-5 text-secondary" />
              Account Settings
            </h2>
          </div>
          <div className="p-4">
            {profileData && (
              <UsernameEditor
                currentUsername={profileData.username}
                lastUsernameChangeAt={profileData.last_username_change_at}
                onUpdate={fetchProfileData}
              />
            )}
          </div>
        </div>

        {/* Profile Privacy & Visibility */}
        <div className="glass-card neon-border-cyan overflow-hidden mb-6">
          <div className="bg-primary/20 px-4 py-3 border-b border-border/50">
            <h2 className="font-semibold flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Profile Privacy & Visibility
            </h2>
          </div>
          <div className="p-4">
            <PrivacySettingsSection />
          </div>
        </div>

        {/* Friends & Followers */}
        <div className="glass-card neon-border-magenta overflow-hidden mb-6">
          <div className="bg-secondary/20 px-4 py-3 border-b border-border/50">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-secondary" />
              Friends & Followers
            </h2>
          </div>
          <div className="p-4">
            <FriendsFollowersSection />
          </div>
        </div>

        {/* Messaging Privacy */}
        <div className="glass-card neon-border-cyan overflow-hidden mb-6">
          <div className="bg-primary/20 px-4 py-3 border-b border-border/50">
            <h2 className="font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Messaging Privacy
            </h2>
          </div>
          <div className="p-4 space-y-6">
            {/* Messaging Privacy */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <Label className="text-base font-medium">Who can message you?</Label>
              </div>
              <RadioGroup
                value={settings?.messaging_privacy || "open"}
                onValueChange={(value) => updatePrivacy.mutate(value as "open" | "friends_only")}
                className="space-y-3"
              >
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="open" id="open" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="open" className="font-medium cursor-pointer">
                      Open Messages
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Anyone can send you a message
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="friends_only" id="friends_only" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="friends_only" className="font-medium cursor-pointer">
                      Friends Only
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Only your friends can message you
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>

        {/* Blocked Users */}
        <div className="glass-card neon-border-magenta overflow-hidden">
          <div className="bg-secondary/20 px-4 py-3 border-b border-border/50">
            <h2 className="font-semibold flex items-center gap-2">
              <Ban className="w-5 h-5 text-secondary" />
              Blocked Users
            </h2>
          </div>
          <div className="p-4">
            {blockedUsers.length === 0 ? (
              <div className="text-center py-8">
                <UserX className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  You haven't blocked anyone
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Block users from their profile page
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {blockedUsers.map((blocked) => (
                  <div
                    key={blocked.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {blocked.blocked_profile?.avatar_url ? (
                        <img
                          src={blocked.blocked_profile.avatar_url}
                          alt={blocked.blocked_profile.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-medium">
                          {blocked.blocked_profile?.username?.[0]?.toUpperCase() || "?"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {blocked.blocked_profile?.username || "Unknown"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => unblockUser.mutate(blocked.blocked_id)}
                      disabled={unblockUser.isPending}
                      className="rounded-full"
                    >
                      {unblockUser.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Unblock"
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
