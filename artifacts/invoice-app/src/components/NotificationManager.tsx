/**
 * Mounts once inside <AppProvider> and:
 *   1. On mount — checks invoices and fires any due/overdue notifications.
 *   2. Every hour  — re-checks (in case the app stays open all day).
 */
import { useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { checkInvoiceNotifications } from "@/lib/notifications";

export default function NotificationManager() {
  const { invoices, clients } = useApp();

  useEffect(() => {
    // Initial check (slight delay to let Supabase finish loading)
    const init = setTimeout(() => {
      checkInvoiceNotifications(invoices, clients);
    }, 3000);

    // Re-check every hour while app is open
    const interval = setInterval(() => {
      checkInvoiceNotifications(invoices, clients);
    }, 60 * 60 * 1000);

    return () => {
      clearTimeout(init);
      clearInterval(interval);
    };
  }, [invoices, clients]);

  return null;
}
