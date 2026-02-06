import { supabase } from "@/integrations/supabase/client";

export type SupportActionType =
    | "case_resolved"
    | "case_escalated"
    | "user_warned"
    | "user_frozen"
    | "listing_hidden"
    | "password_reset_triggered"
    | "internal_note_added"
    | "reply_template_created"
    | "reply_template_updated"
    | "reply_template_deleted";

export type TargetType = "case" | "user" | "listing" | "saved_reply" | "system";

export async function logSupportAction({
    agentId,
    actionType,
    targetType,
    targetId,
    metadata = {}
}: {
    agentId: string;
    actionType: SupportActionType;
    targetType: TargetType;
    targetId?: string;
    metadata?: any;
}) {
    const { error } = await (supabase as any)
        .from("support_actions")
        .insert({
            agent_id: agentId,
            action_type: actionType,
            target_type: targetType,
            target_id: targetId,
            metadata
        });

    if (error) {
        console.error("Error logging support action:", error);
        return { success: false, error };
    }

    return { success: true };
}
