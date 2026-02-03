import { usePrivacySettings } from "@/hooks/usePrivacySettings";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Eye,
  EyeOff,
  Users,
  UserPlus,
  Globe,
  Lock,
  Shield,
  Loader2,
} from "lucide-react";

export function PrivacySettingsSection() {
  const {
    settings,
    isLoading,
    updateProfileVisibility,
    updateOnlineStatusVisibility,
    updateFriendRequestPermission,
    updateFollowPermission,
  } = usePrivacySettings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Profile Visibility */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Profile Visibility</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Control who can see your profile content
        </p>
        <RadioGroup
          value={settings?.profile_visibility || "public"}
          onValueChange={(value) =>
            updateProfileVisibility.mutate(value as "public" | "friends_only" | "private")
          }
          className="space-y-3"
        >
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="public" id="visibility-public" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="visibility-public" className="font-medium cursor-pointer flex items-center gap-2">
                <Globe className="w-4 h-4 text-accent" />
                Public
              </Label>
              <p className="text-sm text-muted-foreground">
                Anyone can view your profile, activity, and social elements
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="friends_only" id="visibility-friends" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="visibility-friends" className="font-medium cursor-pointer flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Friends Only
              </Label>
              <p className="text-sm text-muted-foreground">
                Only accepted friends can see your full profile
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="private" id="visibility-private" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="visibility-private" className="font-medium cursor-pointer flex items-center gap-2">
                <Lock className="w-4 h-4 text-secondary" />
                Private
              </Label>
              <p className="text-sm text-muted-foreground">
                Only you can see your profile. You won't appear in search results.
              </p>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Online Status */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold">Show Online Status</h3>
              <p className="text-sm text-muted-foreground">
                Let others see when you're online
              </p>
            </div>
          </div>
          <Switch
            checked={settings?.show_online_status ?? true}
            onCheckedChange={(checked) => updateOnlineStatusVisibility.mutate(checked)}
          />
        </div>
      </div>

      {/* Friend Request Permission */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Who Can Send Friend Requests</h3>
        </div>
        <RadioGroup
          value={settings?.friend_request_permission || "everyone"}
          onValueChange={(value) =>
            updateFriendRequestPermission.mutate(
              value as "everyone" | "friends_of_friends" | "no_one"
            )
          }
          className="space-y-3"
        >
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="everyone" id="friend-everyone" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="friend-everyone" className="font-medium cursor-pointer">
                Everyone
              </Label>
              <p className="text-sm text-muted-foreground">
                Anyone can send you a friend request
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="friends_of_friends" id="friend-fof" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="friend-fof" className="font-medium cursor-pointer">
                Friends of Friends
              </Label>
              <p className="text-sm text-muted-foreground">
                Only people with mutual friends can send requests
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="no_one" id="friend-noone" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="friend-noone" className="font-medium cursor-pointer">
                No One
              </Label>
              <p className="text-sm text-muted-foreground">
                Disable friend requests entirely
              </p>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Follow Permission */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Who Can Follow You</h3>
        </div>
        <RadioGroup
          value={settings?.follow_permission || "everyone"}
          onValueChange={(value) =>
            updateFollowPermission.mutate(value as "everyone" | "approval_required" | "no_one")
          }
          className="space-y-3"
        >
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="everyone" id="follow-everyone" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="follow-everyone" className="font-medium cursor-pointer">
                Everyone
              </Label>
              <p className="text-sm text-muted-foreground">
                Anyone can follow you instantly
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="approval_required" id="follow-approval" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="follow-approval" className="font-medium cursor-pointer">
                Approval Required
              </Label>
              <p className="text-sm text-muted-foreground">
                You must approve each follow request
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="no_one" id="follow-noone" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="follow-noone" className="font-medium cursor-pointer">
                No One
              </Label>
              <p className="text-sm text-muted-foreground">
                Disable followers entirely
              </p>
            </div>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}
