import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Play,
  ExternalLink,
  MoreHorizontal,
  Music,
  Edit2,
  X,
  Save,
  AlertCircle,
  Plus,
  Trash2,
  GripVertical
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Reorder, useDragControls } from "framer-motion";

export interface Track {
  id: string;
  playlist_id: string;
  title: string;
  youtube_url: string;
  youtube_video_id: string;
  position: number;
}

export interface Playlist {
  id: string;
  user_id: string;
  title: string;
}

interface MusicPlayerSectionProps {
  playlist: Playlist | null;
  tracks: Track[];
  isOwnProfile: boolean;
  onSaveTrack: (title: string, url: string, videoId: string) => Promise<void>;
  onRemoveTrack: (trackId: string) => Promise<void>;
  onReorderTracks: (newTracks: Track[]) => Promise<void>;
  onUpdateTitle: (newTitle: string) => Promise<void>;
}

// Video ID extraction
const extractVideoId = (url: string): string | null => {
  if (!url) return null;

  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);

    // youtu.be/VIDEO_ID
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1).split(/[?#]/)[0];
    }

    // youtube.com/watch?v=VIDEO_ID
    if (urlObj.hostname.includes('youtube.com')) {
      if (urlObj.pathname === '/watch') {
        return urlObj.searchParams.get('v');
      }
      // For cases like youtube.com/v/VIDEO_ID or youtube.com/embed/VIDEO_ID if we care
      if (urlObj.pathname.startsWith('/v/') || urlObj.pathname.startsWith('/embed/')) {
        return urlObj.pathname.split('/')[2];
      }
    }
  } catch (e) {
    // Fallback for simple string matching if URL parsing fails
    if (url.includes("youtu.be/")) {
      const parts = url.split("youtu.be/")[1];
      return parts.split(/[?#]/)[0];
    }
    if (url.includes("v=")) {
      const match = url.match(/[?&]v=([^&#]+)/);
      return match ? match[1] : null;
    }
  }
  return null;
};

// URL Validation
const isValidVideoUrl = (url: string): boolean => {
  if (!url) return false;

  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);

    // Explicitly reject standalone playlist pages
    if (urlObj.pathname === '/playlist') return false;

    const id = extractVideoId(url);
    if (!id || id.length < 10) return false; // YouTube IDs are usually 11 chars

    return true;
  } catch (e) {
    return false;
  }
};

export function MusicPlayerSection({
  playlist,
  tracks,
  isOwnProfile,
  onSaveTrack,
  onRemoveTrack,
  onReorderTracks,
  onUpdateTitle,
}: MusicPlayerSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newTrackTitle, setNewTrackTitle] = useState("");
  const [newTrackUrl, setNewTrackUrl] = useState("");
  const [playlistTitle, setPlaylistTitle] = useState(playlist?.title || "My Playlist");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [isMusicMode, setIsMusicMode] = useState(false);

  const sortedTracks = [...tracks].sort((a, b) => a.position - b.position);

  // Set default selected track
  useEffect(() => {
    if (!selectedTrackId && sortedTracks.length > 0) {
      setSelectedTrackId(sortedTracks[0].youtube_video_id);
    }
  }, [selectedTrackId, sortedTracks]);

  const handleAddTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackTitle.trim() || !newTrackUrl.trim()) {
      setError("Please fill in both title and URL.");
      return;
    }

    if (!isValidVideoUrl(newTrackUrl)) {
      setError("Please paste a valid YouTube video link.");
      return;
    }

    const videoId = extractVideoId(newTrackUrl);
    if (!videoId) {
      setError("Failed to extract video ID.");
      return;
    }

    const normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;
    setError(null);
    setIsAdding(true);
    try {
      await onSaveTrack(newTrackTitle, normalizedUrl, videoId);
      setNewTrackTitle("");
      setNewTrackUrl("");
      if (!selectedTrackId) setSelectedTrackId(videoId);
      setError(null);
    } catch (err: any) {
      console.error("Error adding track:", err);
      setError(err?.message || "Failed to add track. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleReorder = async (newOrder: Track[]) => {
    // Only trigger save if reordering actually happened
    await onReorderTracks(newOrder);
  };

  const handleTitleBlur = () => {
    if (playlistTitle !== playlist?.title) {
      onUpdateTitle(playlistTitle);
    }
  };

  if (!playlist && !isOwnProfile) return null;

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground uppercase tracking-widest text-[10px] font-bold">
          <Music className="w-3 h-3" />
          <span>Music</span>
        </div>
        {isOwnProfile && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 rounded-full hover:bg-white/10"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? (
              <>
                <X className="h-4 w-4" />
                Done
              </>
            ) : (
              <>
                <Edit2 className="h-4 w-4" />
                Edit Playlist
              </>
            )}
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {isEditing ? (
          <div className="space-y-6 slide-in">
            {/* Title Editor */}
            <div className="space-y-2">
              <Label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Playlist Title</Label>
              <Input
                value={playlistTitle}
                onChange={(e) => setPlaylistTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className="bg-white/5 border-white/10 text-xl font-bold h-12 focus-visible:ring-primary"
              />
            </div>

            {/* Add Track Form */}
            <form onSubmit={handleAddTrack} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Plus className="w-3 h-3" />
                Add New Track
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="track-title" className="text-[10px] text-white/40 font-bold">Track Title</Label>
                  <Input
                    id="track-title"
                    placeholder="e.g. Favorite Song"
                    value={newTrackTitle}
                    onChange={(e) => setNewTrackTitle(e.target.value)}
                    className="bg-black/20 border-white/5 h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="track-url" className="text-[10px] text-white/40 font-bold">YouTube URL</Label>
                  <Input
                    id="track-url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={newTrackUrl}
                    onChange={(e) => {
                      setNewTrackUrl(e.target.value);
                      setError(null);
                    }}
                    className="bg-black/20 border-white/5 h-10"
                  />
                </div>
              </div>
              {error && (
                <p className="text-red-400 text-[10px] flex items-center gap-1 font-bold animate-pulse">
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </p>
              )}
              <Button
                type="submit"
                disabled={isAdding}
                className="w-full bg-primary text-black font-bold h-10 rounded-lg hover:scale-[1.02] transition-transform"
              >
                {isAdding ? "Adding..." : "Add to Playlist"}
              </Button>
            </form>

            {/* Reorderable List */}
            <div className="space-y-2">
              <Label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Manage Tracks</Label>
              <Reorder.Group
                axis="y"
                values={sortedTracks}
                onReorder={handleReorder}
                className="space-y-2"
              >
                {sortedTracks.map((track) => (
                  <Reorder.Item
                    key={track.id}
                    value={track}
                    className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 group"
                  >
                    <GripVertical className="w-4 h-4 text-white/20 cursor-grab active:cursor-grabbing" />
                    <img
                      src={`https://img.youtube.com/vi/${track.youtube_video_id}/hqdefault.jpg`}
                      alt=""
                      className="w-16 h-9 object-cover rounded shadow-lg shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{track.title}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onRemoveTrack(track.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-white">
                  {playlist?.title || "My Playlist"}
                </h2>
                {sortedTracks.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary hover:bg-primary/10 gap-2 p-0"
                    onClick={() => setIsMusicMode(!isMusicMode)}
                  >
                    {isMusicMode ? "Switch to Video Mode" : "Switch to Music Mode"}
                  </Button>
                )}
              </div>

              {sortedTracks.length > 0 && (
                <Button
                  onClick={() => {
                    const ids = sortedTracks.map(t => t.youtube_video_id).join(',');
                    window.open(`https://www.youtube.com/watch_videos?video_ids=${ids}`, "_blank");
                  }}
                  className="bg-primary text-black font-bold h-9 rounded-full px-6 gap-2 hover:scale-105 transition-transform shrink-0"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Play All on YouTube
                </Button>
              )}
            </div>

            {/* In-Site Video Player */}
            {selectedTrackId && (
              <div
                className={cn(
                  "w-full relative rounded-2xl overflow-hidden shadow-2xl bg-black/40 border border-white/10 transition-all duration-500 ease-in-out fade-in",
                  isMusicMode ? "h-[60px]" : "aspect-video"
                )}
              >
                <iframe
                  width="100%"
                  height={isMusicMode ? "200%" : "100%"}
                  src={`https://www.youtube.com/embed/${selectedTrackId}?playlist=${sortedTracks.map(t => t.youtube_video_id).join(',')}&rel=0&modestbranding=1`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className={cn(
                    "absolute transition-all duration-500",
                    isMusicMode ? "-top-[140%] left-0" : "inset-0"
                  )}
                />
              </div>
            )}

            {sortedTracks.length > 0 ? (
              <div className="space-y-1">
                <Label className="text-[10px] text-white/40 uppercase tracking-widest font-bold ml-1 mb-2 block">Track List</Label>
                {sortedTracks.map((track, idx) => {
                  const isActive = track.youtube_video_id === selectedTrackId;
                  return (
                    <div
                      key={track.id}
                      className={cn(
                        "flex items-center gap-4 p-3 rounded-xl transition-all group border border-transparent cursor-pointer",
                        isActive ? "bg-primary/10 border-primary/20" : "hover:bg-white/5 hover:border-white/5"
                      )}
                      onClick={() => setSelectedTrackId(track.youtube_video_id)}
                    >
                      <div className={cn(
                        "w-6 text-[10px] font-bold text-center",
                        isActive ? "text-primary" : "text-white/20"
                      )}>
                        {isActive ? <Play className="w-3 h-3 mx-auto fill-current" /> : idx + 1}
                      </div>
                      <div className="relative shrink-0">
                        <img
                          src={`https://img.youtube.com/vi/${track.youtube_video_id}/hqdefault.jpg`}
                          alt=""
                          className="w-16 h-9 md:w-20 md:h-[45px] object-cover rounded shadow-lg shadow-black/50"
                        />
                        {!isActive && (
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                            <Play className="w-5 h-5 text-white fill-current" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-bold transition-colors truncate",
                          isActive ? "text-primary" : "text-white/90 group-hover:text-white"
                        )}>
                          {track.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-white/10 text-white/40"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(track.youtube_url, "_blank");
                          }}
                          title="Open on YouTube"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center rounded-2xl border border-dashed border-white/10 bg-white/5">
                <p className="text-white/40 text-sm font-medium">No tracks yet.</p>
                {isOwnProfile && (
                  <Button
                    variant="link"
                    className="text-primary font-bold mt-2"
                    onClick={() => setIsEditing(true)}
                  >
                    Start building your playlist
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
