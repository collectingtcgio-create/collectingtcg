export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_feed: {
        Row: {
          activity_type: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_feed_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      card_cache: {
        Row: {
          card_name: string
          card_number: string | null
          created_at: string
          external_id: string
          id: string
          image_url: string | null
          image_url_small: string | null
          metadata: Json | null
          price_currency: string | null
          price_high: number | null
          price_low: number | null
          price_market: number | null
          price_mid: number | null
          price_source: string | null
          price_updated_at: string | null
          rarity: string | null
          set_code: string | null
          set_name: string | null
          tcg_game: Database["public"]["Enums"]["tcg_game"]
          updated_at: string
        }
        Insert: {
          card_name: string
          card_number?: string | null
          created_at?: string
          external_id: string
          id?: string
          image_url?: string | null
          image_url_small?: string | null
          metadata?: Json | null
          price_currency?: string | null
          price_high?: number | null
          price_low?: number | null
          price_market?: number | null
          price_mid?: number | null
          price_source?: string | null
          price_updated_at?: string | null
          rarity?: string | null
          set_code?: string | null
          set_name?: string | null
          tcg_game: Database["public"]["Enums"]["tcg_game"]
          updated_at?: string
        }
        Update: {
          card_name?: string
          card_number?: string | null
          created_at?: string
          external_id?: string
          id?: string
          image_url?: string | null
          image_url_small?: string | null
          metadata?: Json | null
          price_currency?: string | null
          price_high?: number | null
          price_low?: number | null
          price_market?: number | null
          price_mid?: number | null
          price_source?: string | null
          price_updated_at?: string | null
          rarity?: string | null
          set_code?: string | null
          set_name?: string | null
          tcg_game?: Database["public"]["Enums"]["tcg_game"]
          updated_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_transactions: {
        Row: {
          created_at: string
          credit_amount: number
          gift_type: Database["public"]["Enums"]["gift_type"]
          id: string
          platform_revenue: number
          recipient_earned: number
          recipient_id: string
          sender_id: string
          source: Database["public"]["Enums"]["gift_source"]
          source_id: string | null
        }
        Insert: {
          created_at?: string
          credit_amount: number
          gift_type: Database["public"]["Enums"]["gift_type"]
          id?: string
          platform_revenue: number
          recipient_earned: number
          recipient_id: string
          sender_id: string
          source: Database["public"]["Enums"]["gift_source"]
          source_id?: string | null
        }
        Update: {
          created_at?: string
          credit_amount?: number
          gift_type?: Database["public"]["Enums"]["gift_type"]
          id?: string
          platform_revenue?: number
          recipient_earned?: number
          recipient_id?: string
          sender_id?: string
          source?: Database["public"]["Enums"]["gift_source"]
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_transactions_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_transactions_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      global_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "global_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kudos: {
        Row: {
          author_id: string
          created_at: string
          id: string
          message: string
          profile_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          message: string
          profile_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          message?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kudos_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kudos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_streams: {
        Row: {
          description: string | null
          ended_at: string | null
          id: string
          is_active: boolean
          started_at: string
          streamer_id: string
          title: string
          viewer_count: number
        }
        Insert: {
          description?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean
          started_at?: string
          streamer_id: string
          title: string
          viewer_count?: number
        }
        Update: {
          description?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean
          started_at?: string
          streamer_id?: string
          title?: string
          viewer_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "live_streams_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          asking_price: number
          card_id: string | null
          card_name: string
          condition: Database["public"]["Enums"]["card_condition"]
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          seller_id: string
          status: Database["public"]["Enums"]["listing_status"]
          tcg_game: Database["public"]["Enums"]["tcg_game"]
          updated_at: string
        }
        Insert: {
          asking_price: number
          card_id?: string | null
          card_name: string
          condition?: Database["public"]["Enums"]["card_condition"]
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          seller_id: string
          status?: Database["public"]["Enums"]["listing_status"]
          tcg_game: Database["public"]["Enums"]["tcg_game"]
          updated_at?: string
        }
        Update: {
          asking_price?: number
          card_id?: string | null
          card_name?: string
          condition?: Database["public"]["Enums"]["card_condition"]
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          seller_id?: string
          status?: Database["public"]["Enums"]["listing_status"]
          tcg_game?: Database["public"]["Enums"]["tcg_game"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "user_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email_contact: string | null
          facebook_url: string | null
          id: string
          instagram_url: string | null
          is_live: boolean | null
          last_username_change_at: string | null
          status: string | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string
          user_id: string
          username: string
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email_contact?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          is_live?: boolean | null
          last_username_change_at?: string | null
          status?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          username: string
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email_contact?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          is_live?: boolean | null
          last_username_change_at?: string | null
          status?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          username?: string
          website_url?: string | null
        }
        Relationships: []
      }
      stream_chat: {
        Row: {
          content: string
          created_at: string
          gift_type: Database["public"]["Enums"]["gift_type"] | null
          id: string
          stream_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          gift_type?: Database["public"]["Enums"]["gift_type"] | null
          id?: string
          stream_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          gift_type?: Database["public"]["Enums"]["gift_type"] | null
          id?: string
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_chat_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_chat_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      top_eight: {
        Row: {
          card_id: string | null
          created_at: string
          friend_id: string | null
          id: string
          position: number
          user_id: string
        }
        Insert: {
          card_id?: string | null
          created_at?: string
          friend_id?: string | null
          id?: string
          position: number
          user_id: string
        }
        Update: {
          card_id?: string | null
          created_at?: string
          friend_id?: string | null
          id?: string
          position?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "top_eight_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "user_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "top_eight_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "top_eight_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_events: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          external_link: string | null
          game_type: Database["public"]["Enums"]["tcg_event_game"]
          id: string
          is_major: boolean | null
          location: string
          start_date: string
          status: Database["public"]["Enums"]["event_status"] | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          external_link?: string | null
          game_type: Database["public"]["Enums"]["tcg_event_game"]
          id?: string
          is_major?: boolean | null
          location: string
          start_date: string
          status?: Database["public"]["Enums"]["event_status"] | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          external_link?: string | null
          game_type?: Database["public"]["Enums"]["tcg_event_game"]
          id?: string
          is_major?: boolean | null
          location?: string
          start_date?: string
          status?: Database["public"]["Enums"]["event_status"] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      trade_items: {
        Row: {
          card_id: string
          created_at: string
          id: string
          owner_id: string
          trade_id: string
        }
        Insert: {
          card_id: string
          created_at?: string
          id?: string
          owner_id: string
          trade_id: string
        }
        Update: {
          card_id?: string
          created_at?: string
          id?: string
          owner_id?: string
          trade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_items_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "user_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_items_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_items_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trade_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_proposals: {
        Row: {
          created_at: string
          id: string
          message: string | null
          proposer_id: string
          recipient_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          proposer_id: string
          recipient_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          proposer_id?: string
          recipient_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_proposals_proposer_id_fkey"
            columns: ["proposer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_proposals_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_cards: {
        Row: {
          card_cache_id: string | null
          card_name: string
          created_at: string
          id: string
          image_url: string | null
          price_estimate: number | null
          tcg_game: Database["public"]["Enums"]["tcg_game"] | null
          user_id: string
        }
        Insert: {
          card_cache_id?: string | null
          card_name: string
          created_at?: string
          id?: string
          image_url?: string | null
          price_estimate?: number | null
          tcg_game?: Database["public"]["Enums"]["tcg_game"] | null
          user_id: string
        }
        Update: {
          card_cache_id?: string | null
          card_name?: string
          created_at?: string
          id?: string
          image_url?: string | null
          price_estimate?: number | null
          tcg_game?: Database["public"]["Enums"]["tcg_game"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_cards_card_cache_id_fkey"
            columns: ["card_cache_id"]
            isOneToOne: false
            referencedRelation: "card_cache"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_event_notifications: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_event_notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "tournament_events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_haves: {
        Row: {
          asking_price: number | null
          card_name: string
          condition: Database["public"]["Enums"]["card_condition"]
          created_at: string
          id: string
          notes: string | null
          tcg_game: Database["public"]["Enums"]["tcg_game"]
          user_id: string
        }
        Insert: {
          asking_price?: number | null
          card_name: string
          condition?: Database["public"]["Enums"]["card_condition"]
          created_at?: string
          id?: string
          notes?: string | null
          tcg_game: Database["public"]["Enums"]["tcg_game"]
          user_id: string
        }
        Update: {
          asking_price?: number | null
          card_name?: string
          condition?: Database["public"]["Enums"]["card_condition"]
          created_at?: string
          id?: string
          notes?: string | null
          tcg_game?: Database["public"]["Enums"]["tcg_game"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_haves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          messaging_privacy: Database["public"]["Enums"]["messaging_privacy"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messaging_privacy?: Database["public"]["Enums"]["messaging_privacy"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messaging_privacy?: Database["public"]["Enums"]["messaging_privacy"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          created_at: string
          earned_balance: number
          eco_credits: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          earned_balance?: number
          eco_credits?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          earned_balance?: number
          eco_credits?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_wants: {
        Row: {
          card_name: string
          created_at: string
          id: string
          max_price: number | null
          notes: string | null
          tcg_game: Database["public"]["Enums"]["tcg_game"]
          user_id: string
        }
        Insert: {
          card_name: string
          created_at?: string
          id?: string
          max_price?: number | null
          notes?: string | null
          tcg_game: Database["public"]["Enums"]["tcg_game"]
          user_id: string
        }
        Update: {
          card_name?: string
          created_at?: string
          id?: string
          max_price?: number | null
          notes?: string | null
          tcg_game?: Database["public"]["Enums"]["tcg_game"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_wants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wall_post_replies: {
        Row: {
          author_id: string
          content: string
          created_at: string
          gift_type: Database["public"]["Enums"]["gift_type"] | null
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          gift_type?: Database["public"]["Enums"]["gift_type"] | null
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          gift_type?: Database["public"]["Enums"]["gift_type"] | null
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wall_post_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wall_post_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "wall_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      wall_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wall_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wall_posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      card_condition:
        | "near_mint"
        | "lightly_played"
        | "moderately_played"
        | "heavily_played"
        | "damaged"
      event_status:
        | "upcoming"
        | "open_registration"
        | "sold_out"
        | "live"
        | "completed"
      gift_source: "live_stream" | "comment_reply" | "direct_message"
      gift_type:
        | "spark_hamster"
        | "pirate_panda"
        | "wizard_owl"
        | "magma_mole"
        | "ghost_cat"
        | "mecha_pup"
      listing_status: "active" | "sold" | "cancelled"
      messaging_privacy: "open" | "friends_only"
      tcg_event_game: "pokemon" | "magic" | "yugioh" | "onepiece" | "lorcana"
      tcg_game:
        | "pokemon"
        | "magic"
        | "yugioh"
        | "onepiece"
        | "dragonball"
        | "lorcana"
        | "unionarena"
        | "marvel"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      card_condition: [
        "near_mint",
        "lightly_played",
        "moderately_played",
        "heavily_played",
        "damaged",
      ],
      event_status: [
        "upcoming",
        "open_registration",
        "sold_out",
        "live",
        "completed",
      ],
      gift_source: ["live_stream", "comment_reply", "direct_message"],
      gift_type: [
        "spark_hamster",
        "pirate_panda",
        "wizard_owl",
        "magma_mole",
        "ghost_cat",
        "mecha_pup",
      ],
      listing_status: ["active", "sold", "cancelled"],
      messaging_privacy: ["open", "friends_only"],
      tcg_event_game: ["pokemon", "magic", "yugioh", "onepiece", "lorcana"],
      tcg_game: [
        "pokemon",
        "magic",
        "yugioh",
        "onepiece",
        "dragonball",
        "lorcana",
        "unionarena",
        "marvel",
      ],
    },
  },
} as const
