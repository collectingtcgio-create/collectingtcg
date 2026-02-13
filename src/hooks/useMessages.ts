import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  sender?: {
    id: string;
    username: string;
    avatar_url: string;
  };
  recipient?: {
    id: string;
    username: string;
    avatar_url: string;
  };
}

export interface Conversation {
  partnerId: string;
  partnerUsername: string;
  partnerAvatar: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export function useMessages() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all messages for conversations list
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, username, avatar_url),
          recipient:profiles!messages_recipient_id_fkey(id, username, avatar_url)
        `)
        .or(`sender_id.eq.${profile.id},recipient_id.eq.${profile.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!profile?.id,
  });

  // Get conversations from messages
  const conversations: Conversation[] = messages.reduce((acc: Conversation[], msg) => {
    if (!profile) return acc;

    const partnerId = msg.sender_id === profile.id ? msg.recipient_id : msg.sender_id;
    const partner = msg.sender_id === profile.id ? msg.recipient : msg.sender;

    const existing = acc.find(c => c.partnerId === partnerId);
    if (existing) {
      // Count unread
      if (msg.recipient_id === profile.id && !msg.read_at) {
        existing.unreadCount++;
      }
      return acc;
    }

    return [...acc, {
      partnerId,
      partnerUsername: partner?.username || "Unknown",
      partnerAvatar: partner?.avatar_url || "",
      lastMessage: msg.content,
      lastMessageAt: msg.created_at,
      unreadCount: msg.recipient_id === profile.id && !msg.read_at ? 1 : 0,
    }];
  }, []);

  // Count total unread messages
  const unreadCount = messages.filter(
    m => profile && m.recipient_id === profile.id && !m.read_at
  ).length;

  // Get messages for a specific conversation
  const getConversation = (partnerId: string) => {
    return messages
      .filter(m => m.sender_id === partnerId || m.recipient_id === partnerId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async ({ recipientId, content }: { recipientId: string; content: string }) => {
      if (!profile) throw new Error("Unable to authenticate. Please try refreshing the page.");

      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: profile.id,
          recipient_id: recipientId,
          content: content.trim(),
        })
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, username, avatar_url),
          recipient:profiles!messages_recipient_id_fkey(id, username, avatar_url)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mark messages as read
  const markAsRead = useMutation({
    mutationFn: async (partnerId: string) => {
      if (!profile) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("sender_id", partnerId)
        .eq("recipient_id", profile.id)
        .is("read_at", null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  // Real-time subscription
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${profile.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, queryClient]);

  return {
    messages,
    conversations,
    unreadCount,
    isLoading,
    getConversation,
    sendMessage,
    markAsRead,
  };
}
