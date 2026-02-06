import { Database } from "@/integrations/supabase/types";

export type DbGiftType = Database["public"]["Enums"]["gift_type"];

export interface WallPost {
    id: string;
    content: string;
    image_url: string | null;
    video_url: string | null;
    created_at: string;
    author: {
        id: string;
        username: string;
        avatar_url: string;
    };
}

export interface WallPostReply {
    id: string;
    content: string;
    created_at: string;
    gift_type: DbGiftType | null;
    author: {
        id: string;
        username: string;
        avatar_url: string;
    };
}
