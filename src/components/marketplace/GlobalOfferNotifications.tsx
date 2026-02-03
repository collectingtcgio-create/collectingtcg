import { useGlobalOfferNotifications } from "@/hooks/useGlobalOfferNotifications";

/**
 * Component that enables global offer notifications.
 * Renders nothing - just activates the notification hook.
 */
export function GlobalOfferNotifications() {
  useGlobalOfferNotifications();
  return null;
}
