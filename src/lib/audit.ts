import { supabase } from "@/integrations/supabase/client";

export type AuditActionType =
    | "user_warned"
    | "user_restricted"
    | "user_suspended"
    | "user_banned"
    | "user_restored"
    | "user_role_changed"
    | "listing_removed"
    | "listing_restored"
    | "listing_frozen"
    | "case_resolved"
    | "case_closed"
    | "setting_updated"
    | "admin_note_added";

export type AuditTargetType = "user" | "listing" | "case" | "system";

interface LogAuditActionParams {
    actorId: string;
    actorRole: string;
    actionType: AuditActionType;
    targetType: AuditTargetType;
    targetId?: string;
    reason?: string;
    metadata?: any;
}

export async function logAuditAction({
    actorId,
    actorRole,
    actionType,
    targetType,
    targetId,
    reason,
    metadata = {},
}: LogAuditActionParams) {
    const { error } = await supabase
        .from("audit_logs")
        .insert({
            actor_id: actorId,
            actor_role: actorRole,
            action_type: actionType,
            target_type: targetType,
            target_id: targetId,
            reason,
            metadata,
        });

    if (error) {
        console.error("Error logging audit action:", error);
        return { success: false, error };
    }

    return { success: true };
}
