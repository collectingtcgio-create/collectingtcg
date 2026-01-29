import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Globe, Instagram, Facebook } from "lucide-react";
import rumbleLogo from "@/assets/rumble-logo.png";

// Custom icons for TikTok and Twitter/X
const TikTokIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const RumbleIcon = () => (
  <img src={rumbleLogo} alt="Rumble" className="w-4 h-4" />
);

interface SocialLinks {
  email_contact: string;
  tiktok_url: string;
  twitter_url: string;
  instagram_url: string;
  facebook_url: string;
  website_url: string;
  rumble_url: string;
}

interface SocialLinksEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLinks: SocialLinks;
  onUpdate: () => void;
}

export function SocialLinksEditor({
  open,
  onOpenChange,
  currentLinks,
  onUpdate,
}: SocialLinksEditorProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [links, setLinks] = useState<SocialLinks>(currentLinks);

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        email_contact: links.email_contact.trim(),
        tiktok_url: links.tiktok_url.trim(),
        twitter_url: links.twitter_url.trim(),
        instagram_url: links.instagram_url.trim(),
        facebook_url: links.facebook_url.trim(),
        website_url: links.website_url.trim(),
        rumble_url: links.rumble_url.trim(),
      })
      .eq("id", profile.id);

    if (error) {
      toast({
        title: "Failed to save",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Saved!",
        description: "Your social links have been updated.",
      });
      onUpdate();
      onOpenChange(false);
    }

    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-card border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Edit Social Links
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-primary" />
              Contact Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={links.email_contact}
              onChange={(e) => setLinks({ ...links, email_contact: e.target.value })}
              className="bg-input border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tiktok" className="flex items-center gap-2 text-sm">
              <TikTokIcon />
              TikTok
            </Label>
            <Input
              id="tiktok"
              type="url"
              placeholder="https://tiktok.com/@username"
              value={links.tiktok_url}
              onChange={(e) => setLinks({ ...links, tiktok_url: e.target.value })}
              className="bg-input border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitter" className="flex items-center gap-2 text-sm">
              <XIcon />
              Twitter / X
            </Label>
            <Input
              id="twitter"
              type="url"
              placeholder="https://x.com/username"
              value={links.twitter_url}
              onChange={(e) => setLinks({ ...links, twitter_url: e.target.value })}
              className="bg-input border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram" className="flex items-center gap-2 text-sm">
              <Instagram className="w-4 h-4 text-pink-500" />
              Instagram
            </Label>
            <Input
              id="instagram"
              type="url"
              placeholder="https://instagram.com/username"
              value={links.instagram_url}
              onChange={(e) => setLinks({ ...links, instagram_url: e.target.value })}
              className="bg-input border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="facebook" className="flex items-center gap-2 text-sm">
              <Facebook className="w-4 h-4 text-blue-600" />
              Facebook
            </Label>
            <Input
              id="facebook"
              type="url"
              placeholder="https://facebook.com/username"
              value={links.facebook_url}
              onChange={(e) => setLinks({ ...links, facebook_url: e.target.value })}
              className="bg-input border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rumble" className="flex items-center gap-2 text-sm">
              <RumbleIcon />
              Rumble
            </Label>
            <Input
              id="rumble"
              type="url"
              placeholder="https://rumble.com/c/username"
              value={links.rumble_url}
              onChange={(e) => setLinks({ ...links, rumble_url: e.target.value })}
              className="bg-input border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-primary" />
              Business Website
            </Label>
            <Input
              id="website"
              type="url"
              placeholder="https://yourwebsite.com"
              value={links.website_url}
              onChange={(e) => setLinks({ ...links, website_url: e.target.value })}
              className="bg-input border-border"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/80"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Display component for social links
export function SocialLinksDisplay({
  links,
  isOwnProfile,
  onEditClick,
}: {
  links: SocialLinks;
  isOwnProfile: boolean;
  onEditClick: () => void;
}) {
  const hasAnyLink =
    links.email_contact ||
    links.tiktok_url ||
    links.twitter_url ||
    links.instagram_url ||
    links.facebook_url ||
    links.website_url ||
    links.rumble_url;

  return (
    <div className="space-y-2">
      {links.email_contact && (
        <a
          href={`mailto:${links.email_contact}`}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Mail className="w-3 h-3" />
          {links.email_contact}
        </a>
      )}
      
      <div className="flex flex-wrap gap-2">
        {links.tiktok_url && (
          <a
            href={links.tiktok_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-muted/50 hover:bg-primary/20 hover:text-primary transition-colors"
            title="TikTok"
          >
            <TikTokIcon />
          </a>
        )}
        {links.twitter_url && (
          <a
            href={links.twitter_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-muted/50 hover:bg-primary/20 hover:text-primary transition-colors"
            title="Twitter / X"
          >
            <XIcon />
          </a>
        )}
        {links.instagram_url && (
          <a
            href={links.instagram_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-muted/50 hover:bg-pink-500/20 hover:text-pink-500 transition-colors"
            title="Instagram"
          >
            <Instagram className="w-4 h-4" />
          </a>
        )}
        {links.facebook_url && (
          <a
            href={links.facebook_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-muted/50 hover:bg-blue-600/20 hover:text-blue-600 transition-colors"
            title="Facebook"
          >
            <Facebook className="w-4 h-4" />
          </a>
        )}
        {links.rumble_url && (
          <a
            href={links.rumble_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-muted/50 hover:bg-green-600/20 hover:text-green-500 transition-colors"
            title="Rumble"
          >
            <RumbleIcon />
          </a>
        )}
        {links.website_url && (
          <a
            href={links.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-muted/50 hover:bg-primary/20 hover:text-primary transition-colors"
            title="Website"
          >
            <Globe className="w-4 h-4" />
          </a>
        )}
      </div>

      {!hasAnyLink && !isOwnProfile && (
        <p className="text-xs text-muted-foreground">No contact info added</p>
      )}

      {isOwnProfile && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onEditClick}
          className="w-full justify-start text-xs h-8 hover:bg-primary/10 hover:text-primary mt-2"
        >
          <Globe className="w-3 h-3 mr-2" />
          {hasAnyLink ? "Edit Social Links" : "Add Social Links"}
        </Button>
      )}
    </div>
  );
}
