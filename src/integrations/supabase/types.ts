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
          {
            foreignKeyName: "activity_feed_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notes: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          target_id: string
          target_type: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          target_id: string
          target_type: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action_type: string
          actor_id: string | null
          actor_role: string
          created_at: string | null
          id: string
          metadata: Json | null
          reason: string | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action_type: string
          actor_id?: string | null
          actor_role: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action_type?: string
          actor_id?: string | null
          actor_role?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
      case_messages: {
        Row: {
          case_id: string | null
          content: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          sender_id: string | null
        }
        Insert: {
          case_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          sender_id?: string | null
        }
        Update: {
          case_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          assigned_agent_id: string | null
          created_at: string | null
          id: string
          priority: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          subject: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_agent_id?: string | null
          created_at?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          subject: string
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_agent_id?: string | null
          created_at?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          subject?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cases_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      followers: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
          status: Database["public"]["Enums"]["follow_status"]
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
          status?: Database["public"]["Enums"]["follow_status"]
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
          status?: Database["public"]["Enums"]["follow_status"]
        }
        Relationships: [
          {
            foreignKeyName: "followers_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followers_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followers_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followers_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: Database["public"]["Enums"]["friendship_status"]
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: Database["public"]["Enums"]["friendship_status"]
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["friendship_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
            foreignKeyName: "gift_transactions_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_transactions_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_transactions_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      global_posts: {
        Row: {
          author_id: string
          card_id: string | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          author_id: string
          card_id?: string | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          author_id?: string
          card_id?: string | null
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
          {
            foreignKeyName: "global_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "global_posts_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "user_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_notes: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          target_id: string
          target_type: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          target_id: string
          target_type: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
            foreignKeyName: "kudos_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kudos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kudos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          listing_id: string
          message_type: string
          offer_id: string | null
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          listing_id: string
          message_type?: string
          offer_id?: string | null
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          listing_id?: string
          message_type?: string
          offer_id?: string | null
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "admin_listings_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_messages_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "listing_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_offers: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string
          expires_at: string
          id: string
          is_counter: boolean
          listing_id: string
          parent_offer_id: string | null
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string
          expires_at?: string
          id?: string
          is_counter?: boolean
          listing_id: string
          parent_offer_id?: string | null
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_counter?: boolean
          listing_id?: string
          parent_offer_id?: string | null
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_offers_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_offers_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "admin_listings_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_offers_parent_offer_id_fkey"
            columns: ["parent_offer_id"]
            isOneToOne: false
            referencedRelation: "listing_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_offers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_offers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
          {
            foreignKeyName: "live_streams_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          accepts_offers: boolean
          admin_notes: string | null
          asking_price: number
          card_id: string | null
          card_name: string
          condition: Database["public"]["Enums"]["card_condition"]
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          images: string[] | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          quantity: number
          rarity: Database["public"]["Enums"]["card_rarity"] | null
          rarity_custom: string | null
          seller_id: string
          sold_at: string | null
          sold_price: number | null
          status: Database["public"]["Enums"]["listing_status"]
          tcg_game: Database["public"]["Enums"]["tcg_game"]
          updated_at: string
        }
        Insert: {
          accepts_offers?: boolean
          admin_notes?: string | null
          asking_price: number
          card_id?: string | null
          card_name: string
          condition?: Database["public"]["Enums"]["card_condition"]
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          quantity?: number
          rarity?: Database["public"]["Enums"]["card_rarity"] | null
          rarity_custom?: string | null
          seller_id: string
          sold_at?: string | null
          sold_price?: number | null
          status?: Database["public"]["Enums"]["listing_status"]
          tcg_game: Database["public"]["Enums"]["tcg_game"]
          updated_at?: string
        }
        Update: {
          accepts_offers?: boolean
          admin_notes?: string | null
          asking_price?: number
          card_id?: string | null
          card_name?: string
          condition?: Database["public"]["Enums"]["card_condition"]
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          quantity?: number
          rarity?: Database["public"]["Enums"]["card_rarity"] | null
          rarity_custom?: string | null
          seller_id?: string
          sold_at?: string | null
          sold_price?: number | null
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
          {
            foreignKeyName: "marketplace_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          admin_notes: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          email_contact: string | null
          facebook_url: string | null
          id: string
          instagram_url: string | null
          is_banned: boolean | null
          is_live: boolean | null
          is_online: boolean | null
          is_restricted: boolean | null
          is_suspended: boolean | null
          last_seen_at: string | null
          last_username_change_at: string | null
          music_autoplay: boolean | null
          rumble_url: string | null
          spotify_playlist_url: string | null
          status: string | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string
          user_id: string
          username: string
          warnings_count: number | null
          website_url: string | null
          youtube_playlist_url: string | null
          youtube_url: string | null
        }
        Insert: {
          admin_notes?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email_contact?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          is_banned?: boolean | null
          is_live?: boolean | null
          is_online?: boolean | null
          is_restricted?: boolean | null
          is_suspended?: boolean | null
          last_seen_at?: string | null
          last_username_change_at?: string | null
          music_autoplay?: boolean | null
          rumble_url?: string | null
          spotify_playlist_url?: string | null
          status?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          username: string
          warnings_count?: number | null
          website_url?: string | null
          youtube_playlist_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          admin_notes?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email_contact?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          is_banned?: boolean | null
          is_live?: boolean | null
          is_online?: boolean | null
          is_restricted?: boolean | null
          is_suspended?: boolean | null
          last_seen_at?: string | null
          last_username_change_at?: string | null
          music_autoplay?: boolean | null
          rumble_url?: string | null
          spotify_playlist_url?: string | null
          status?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          username?: string
          warnings_count?: number | null
          website_url?: string | null
          youtube_playlist_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string | null
          id: string
          reason: string
          reported_listing_id: string | null
          reported_user_id: string | null
          reporter_id: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason: string
          reported_listing_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string
          reported_listing_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_listing_id_fkey"
            columns: ["reported_listing_id"]
            isOneToOne: false
            referencedRelation: "admin_listings_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_listing_id_fkey"
            columns: ["reported_listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_replies: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          id: string
          title: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          title: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      scan_cache: {
        Row: {
          candidates: Json | null
          card_name: string | null
          card_number: string | null
          confidence: number | null
          created_at: string
          expires_at: string
          game: string
          id: string
          identifier: string
          image_url: string | null
          price_high: number | null
          price_low: number | null
          price_market: number | null
          raw_ocr_text: string | null
          set_name: string | null
        }
        Insert: {
          candidates?: Json | null
          card_name?: string | null
          card_number?: string | null
          confidence?: number | null
          created_at?: string
          expires_at?: string
          game: string
          id?: string
          identifier: string
          image_url?: string | null
          price_high?: number | null
          price_low?: number | null
          price_market?: number | null
          raw_ocr_text?: string | null
          set_name?: string | null
        }
        Update: {
          candidates?: Json | null
          card_name?: string | null
          card_number?: string | null
          confidence?: number | null
          created_at?: string
          expires_at?: string
          game?: string
          id?: string
          identifier?: string
          image_url?: string | null
          price_high?: number | null
          price_low?: number | null
          price_market?: number | null
          raw_ocr_text?: string | null
          set_name?: string | null
        }
        Relationships: []
      }
      scan_rate_limits: {
        Row: {
          id: string
          scan_count: number
          user_identifier: string
          window_start: string
        }
        Insert: {
          id?: string
          scan_count?: number
          user_identifier: string
          window_start?: string
        }
        Update: {
          id?: string
          scan_count?: number
          user_identifier?: string
          window_start?: string
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
          {
            foreignKeyName: "stream_chat_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_actions: {
        Row: {
          action_type: string
          agent_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          target_id: string
          target_type: string
        }
        Insert: {
          action_type: string
          agent_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_id: string
          target_type: string
        }
        Update: {
          action_type?: string
          agent_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_actions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_actions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
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
            foreignKeyName: "top_eight_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "top_eight_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "top_eight_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
            foreignKeyName: "trade_items_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
            foreignKeyName: "trade_proposals_proposer_id_fkey"
            columns: ["proposer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_proposals_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_proposals_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
          quantity: number
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
          quantity?: number
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
          quantity?: number
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
          {
            foreignKeyName: "user_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
          {
            foreignKeyName: "user_haves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_roles_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string
          follow_permission: Database["public"]["Enums"]["follow_permission"]
          friend_request_permission: Database["public"]["Enums"]["friend_request_permission"]
          id: string
          messaging_privacy: Database["public"]["Enums"]["messaging_privacy"]
          profile_visibility: Database["public"]["Enums"]["profile_visibility"]
          show_online_status: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          follow_permission?: Database["public"]["Enums"]["follow_permission"]
          friend_request_permission?: Database["public"]["Enums"]["friend_request_permission"]
          id?: string
          messaging_privacy?: Database["public"]["Enums"]["messaging_privacy"]
          profile_visibility?: Database["public"]["Enums"]["profile_visibility"]
          show_online_status?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          follow_permission?: Database["public"]["Enums"]["follow_permission"]
          friend_request_permission?: Database["public"]["Enums"]["friend_request_permission"]
          id?: string
          messaging_privacy?: Database["public"]["Enums"]["messaging_privacy"]
          profile_visibility?: Database["public"]["Enums"]["profile_visibility"]
          show_online_status?: boolean
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
          {
            foreignKeyName: "user_wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
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
          {
            foreignKeyName: "user_wants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
            foreignKeyName: "wall_post_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
          video_url: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          profile_id: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          profile_id?: string
          updated_at?: string
          video_url?: string | null
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
            foreignKeyName: "wall_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wall_posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wall_posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_listings_view: {
        Row: {
          accepts_offers: boolean | null
          admin_notes: string | null
          asking_price: number | null
          card_id: string | null
          card_name: string | null
          condition: Database["public"]["Enums"]["card_condition"] | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          images: string[] | null
          listing_type: Database["public"]["Enums"]["listing_type"] | null
          quantity: number | null
          rarity: Database["public"]["Enums"]["card_rarity"] | null
          rarity_custom: string | null
          seller_id: string | null
          seller_username: string | null
          sold_at: string | null
          sold_price: number | null
          status: Database["public"]["Enums"]["listing_status"] | null
          tcg_game: Database["public"]["Enums"]["tcg_game"] | null
          updated_at: string | null
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
          {
            foreignKeyName: "marketplace_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          id: string | null
          is_live: boolean | null
          last_username_change_at: string | null
          music_autoplay: boolean | null
          spotify_playlist_url: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          username: string | null
          youtube_playlist_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string | null
          is_live?: boolean | null
          last_username_change_at?: string | null
          music_autoplay?: boolean | null
          spotify_playlist_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
          youtube_playlist_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string | null
          is_live?: boolean | null
          last_username_change_at?: string | null
          music_autoplay?: boolean | null
          spotify_playlist_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
          youtube_playlist_url?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      are_friends: {
        Args: { _user1_id: string; _user2_id: string }
        Returns: boolean
      }
      can_view_profile: {
        Args: { _profile_id: string; _viewer_id: string }
        Returns: boolean
      }
      get_profile_id: { Args: { _user_id: string }; Returns: string }
      has_block_between: {
        Args: { _user1_id: string; _user2_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_blocked: {
        Args: { _blocked_id: string; _blocker_id: string }
        Returns: boolean
      }
      is_listing_seller: {
        Args: { _listing_id: string; _seller_id: string }
        Returns: boolean
      }
      search_marketplace_listings: {
        Args: { search_query: string; similarity_threshold?: number }
        Returns: {
          asking_price: number
          card_id: string
          card_name: string
          condition: Database["public"]["Enums"]["card_condition"]
          created_at: string
          description: string
          id: string
          image_url: string
          images: string[]
          listing_type: Database["public"]["Enums"]["listing_type"]
          quantity: number
          rarity: Database["public"]["Enums"]["card_rarity"]
          rarity_custom: string
          seller_id: string
          similarity_score: number
          sold_at: string
          sold_price: number
          status: Database["public"]["Enums"]["listing_status"]
          tcg_game: Database["public"]["Enums"]["tcg_game"]
          updated_at: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      validate_counter_offer: {
        Args: {
          _buyer_id: string
          _listing_id: string
          _parent_offer_id: string
          _seller_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "support"
      card_condition:
        | "near_mint"
        | "lightly_played"
        | "moderately_played"
        | "heavily_played"
        | "damaged"
      card_rarity:
        | "common"
        | "uncommon"
        | "rare"
        | "holo_rare"
        | "ultra_rare"
        | "secret_rare"
        | "special_art"
        | "full_art"
        | "promo"
        | "other"
      event_status:
        | "upcoming"
        | "open_registration"
        | "sold_out"
        | "live"
        | "completed"
      follow_permission: "everyone" | "approval_required" | "no_one"
      follow_status: "pending" | "approved"
      friend_request_permission: "everyone" | "friends_of_friends" | "no_one"
      friendship_status: "pending" | "accepted" | "declined"
      gift_source: "live_stream" | "comment_reply" | "direct_message"
      gift_type:
        | "spark_hamster"
        | "pirate_panda"
        | "wizard_owl"
        | "magma_mole"
        | "ghost_cat"
        | "mecha_pup"
      listing_status: "active" | "sold" | "cancelled" | "frozen"
      listing_type: "single" | "lot" | "sealed" | "bundle"
      messaging_privacy: "open" | "friends_only" | "buyers_only"
      profile_visibility: "public" | "friends_only" | "private"
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
        | "starwars"
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
      app_role: ["admin", "moderator", "user", "support"],
      card_condition: [
        "near_mint",
        "lightly_played",
        "moderately_played",
        "heavily_played",
        "damaged",
      ],
      card_rarity: [
        "common",
        "uncommon",
        "rare",
        "holo_rare",
        "ultra_rare",
        "secret_rare",
        "special_art",
        "full_art",
        "promo",
        "other",
      ],
      event_status: [
        "upcoming",
        "open_registration",
        "sold_out",
        "live",
        "completed",
      ],
      follow_permission: ["everyone", "approval_required", "no_one"],
      follow_status: ["pending", "approved"],
      friend_request_permission: ["everyone", "friends_of_friends", "no_one"],
      friendship_status: ["pending", "accepted", "declined"],
      gift_source: ["live_stream", "comment_reply", "direct_message"],
      gift_type: [
        "spark_hamster",
        "pirate_panda",
        "wizard_owl",
        "magma_mole",
        "ghost_cat",
        "mecha_pup",
      ],
      listing_status: ["active", "sold", "cancelled", "frozen"],
      listing_type: ["single", "lot", "sealed", "bundle"],
      messaging_privacy: ["open", "friends_only", "buyers_only"],
      profile_visibility: ["public", "friends_only", "private"],
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
        "starwars",
      ],
    },
  },
} as const

