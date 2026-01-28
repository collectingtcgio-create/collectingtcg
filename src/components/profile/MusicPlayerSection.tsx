import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Music, Youtube, Edit2, Save, X, Play } from "lucide-react";

interface MusicPlayerSectionProps {
  spotifyUrl: string;
  youtubeUrl: string;
  autoplay: boolean;
  isOwnProfile: boolean;
  onSave: (spotifyUrl: string, youtubeUrl: string, autoplay: boolean) => Promise<void>;
}

// Extract Spotify embed ID from various URL formats
const extractSpotifyId = (url: string): { type: string; id: string } | null => {
  if (!url) return null;
  
  // Handle open.spotify.com URLs
  const patterns = [
    /spotify\.com\/playlist\/([a-zA-Z0-9]+)/,
    /spotify\.com\/album\/([a-zA-Z0-9]+)/,
    /spotify\.com\/track\/([a-zA-Z0-9]+)/,
    /spotify\.com\/artist\/([a-zA-Z0-9]+)/,
  ];
  
  const types = ['playlist', 'album', 'track', 'artist'];
  
  for (let i = 0; i < patterns.length; i++) {
    const match = url.match(patterns[i]);
    if (match) {
      return { type: types[i], id: match[1] };
    }
  }
  
  return null;
};

// Extract YouTube video/playlist ID from various URL formats
const extractYoutubeId = (url: string): { type: string; id: string; videoId?: string } | null => {
  if (!url) return null;
  
  // Check for playlist first - various formats
  // Format: youtube.com/playlist?list=PLxxxxxx
  const playlistOnlyMatch = url.match(/youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/);
  if (playlistOnlyMatch) {
    return { type: 'playlist', id: playlistOnlyMatch[1] };
  }
  
  // Format: youtube.com/watch?v=xxxxx&list=PLxxxxxx or youtube.com/watch?list=PLxxxxxx&v=xxxxx
  const playlistWithVideoMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  const videoInPlaylistMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (playlistWithVideoMatch) {
    return { 
      type: 'playlist', 
      id: playlistWithVideoMatch[1],
      videoId: videoInPlaylistMatch?.[1]
    };
  }
  
  // Video patterns (when no playlist)
  const videoPatterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    /youtu\.be\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/,
  ];
  
  for (const pattern of videoPatterns) {
    const match = url.match(pattern);
    if (match) {
      return { type: 'video', id: match[1] };
    }
  }
  
  return null;
};

// Build YouTube embed URL.
// Important: browsers typically block autoplay WITH sound; we only autoplay reliably when muted.
const buildYoutubeEmbedUrl = (
  embed: { type: string; id: string; videoId?: string },
  autoplay: boolean,
): string => {
  const params = new URLSearchParams();

  // Better behavior on mobile Safari
  params.set("playsinline", "1");

  // Reduce cross-video recommendations; not always honored but harmless
  params.set("rel", "0");
  params.set("modestbranding", "1");

  if (autoplay) {
    params.set("autoplay", "1");
    params.set("mute", "1");
  }

  if (embed.type === "playlist") {
    // Force playlist mode (this shows the playlist queue; YouTube embeds always play a video)
    params.set("listType", "playlist");
    params.set("list", embed.id);
    return `https://www.youtube.com/embed?${params.toString()}`;
  }

  return `https://www.youtube.com/embed/${embed.id}?${params.toString()}`;
};

export function MusicPlayerSection({ 
  spotifyUrl, 
  youtubeUrl,
  autoplay,
  isOwnProfile, 
  onSave 
}: MusicPlayerSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editSpotify, setEditSpotify] = useState(spotifyUrl);
  const [editYoutube, setEditYoutube] = useState(youtubeUrl);
  const [editAutoplay, setEditAutoplay] = useState(autoplay);
  const [saving, setSaving] = useState(false);

  const spotifyEmbed = extractSpotifyId(spotifyUrl);
  const youtubeEmbed = extractYoutubeId(youtubeUrl);
  const editYoutubeParsed = extractYoutubeId(editYoutube);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editSpotify, editYoutube, editAutoplay);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditSpotify(spotifyUrl);
    setEditYoutube(youtubeUrl);
    setEditAutoplay(autoplay);
    setIsEditing(false);
  };

  // Don't show section if no music configured and not own profile
  if (!spotifyUrl && !youtubeUrl && !isOwnProfile) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          Music
        </h3>
        {isOwnProfile && !isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Edit2 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4 p-4 rounded-lg border border-border/50 bg-card/50">
          <div className="space-y-2">
            <Label htmlFor="spotify-url" className="flex items-center gap-2">
              <Music className="w-4 h-4 text-[#1DB954]" />
              Spotify URL
            </Label>
            <Input
              id="spotify-url"
              placeholder="https://open.spotify.com/playlist/..."
              value={editSpotify}
              onChange={(e) => setEditSpotify(e.target.value)}
              className="bg-background/50"
            />
            <p className="text-xs text-muted-foreground">
              Paste a Spotify playlist, album, track, or artist URL
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="youtube-url" className="flex items-center gap-2">
              <Youtube className="w-4 h-4 text-[#FF0000]" />
              YouTube URL
            </Label>
            <Input
              id="youtube-url"
              placeholder="https://youtube.com/playlist?list=... or video URL"
              value={editYoutube}
              onChange={(e) => setEditYoutube(e.target.value)}
              className="bg-background/50"
            />
            <p className="text-xs text-muted-foreground">
              Paste a YouTube playlist URL (e.g., youtube.com/playlist?list=...) or video URL
            </p>
            {editYoutube?.trim() && (
              <p className="text-xs text-muted-foreground">
                {editYoutubeParsed?.type === "playlist"
                  ? "Detected: Playlist"
                  : editYoutubeParsed?.type === "video"
                    ? "Detected: Video (to show a playlist, paste a URL that contains list=...)"
                    : "Couldn’t recognize this URL—try a YouTube playlist link containing list=..."}
              </p>
            )}
          </div>

          {/* Autoplay Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-primary" />
              <div>
                <Label htmlFor="autoplay-toggle" className="text-sm font-medium cursor-pointer">
                  Autoplay Music
                </Label>
                <p className="text-xs text-muted-foreground">
                  Autoplay starts muted (browsers block autoplay with sound)
                </p>
              </div>
            </div>
            <Switch
              id="autoplay-toggle"
              checked={editAutoplay}
              onCheckedChange={setEditAutoplay}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-1" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Autoplay indicator */}
          {autoplay && (spotifyEmbed || youtubeEmbed) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Play className="w-3 h-3" />
              <span>Autoplay enabled (starts muted)</span>
            </div>
          )}

          {/* Spotify Player */}
          {spotifyEmbed && (
            <div className="rounded-lg overflow-hidden">
              <iframe
                key={`${spotifyEmbed.type}:${spotifyEmbed.id}:${autoplay ? "1" : "0"}`}
                src={`https://open.spotify.com/embed/${spotifyEmbed.type}/${spotifyEmbed.id}?utm_source=generator&theme=0${autoplay ? "&autoplay=1" : ""}`}
                width="100%"
                height="152"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="rounded-lg"
              />
            </div>
          )}

          {/* YouTube Player */}
          {youtubeEmbed && (
            <div className="rounded-lg overflow-hidden aspect-video">
              <iframe
                key={`${youtubeEmbed.type}:${youtubeEmbed.id}:${autoplay ? "1" : "0"}`}
                src={buildYoutubeEmbedUrl(youtubeEmbed, autoplay)}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                className="rounded-lg"
              />
            </div>
          )}

          {/* Empty state for own profile */}
          {!spotifyEmbed && !youtubeEmbed && isOwnProfile && (
            <div className="text-center py-8 text-muted-foreground border border-dashed border-border/50 rounded-lg">
              <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No music configured yet</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="mt-2"
              >
                Add Music
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
