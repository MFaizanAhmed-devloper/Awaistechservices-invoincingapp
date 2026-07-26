/**
 * PWA Notification helpers — invoice due / overdue alerts.
 * Works on Android Chrome, desktop Chrome/Firefox/Edge.
 * iOS 16.4+ requires the app to be installed via "Add to Home Screen".
 */

const PREF_KEY = "ats_notifications_enabled";
const LAST_CHECK_KEY = "ats_notif_last_check";

export function isNotificationsSupported(): boolean {
  return "Notification" in window;
}

export function getPermissionStatus(): NotificationPermission | "unsupported" {
  if (!isNotificationsSupported()) return "unsupported";
  return Notification.permission;
}

export function isNotificationsEnabled(): boolean {
  return localStorage.getItem(PREF_KEY) === "true" && Notification.permission === "granted";
}

export function setNotificationsEnabled(val: boolean): void {
  localStorage.setItem(PREF_KEY, val ? "true" : "false");
}

/** Ask the user for notification permission. Returns true if granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationsSupported()) return false;
  if (Notification.permission === "granted") return true;
  const result = await Notification.requestPermission();
  return result === "granted";
}

/** Show a single notification, preferring the service-worker channel so it
 *  works even when the tab is in the background. */
export function showNotification(title: string, body: string, tag?: string) {
  if (!isNotificationsSupported() || Notification.permission !== "granted") return;

  const opts: NotificationOptions = {
    body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    tag: tag ?? "ats-invoice",
    requireInteraction: false,
  };

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then(reg => reg.showNotification(title, opts))
      .catch(() => new Notification(title, opts));
  } else {
    new Notification(title, opts);
  }
}

interface MinimalInvoice {
  invoiceNumber: string;
  status: string;
  dueDate: string;
  clientId: string;
}

interface MinimalClient {
  id: string;
  name: string;
}

/**
 * Check invoices and fire browser notifications for:
 * - Overdue invoices (past due date, not paid)
 * - Invoices due within 3 days
 *
 * Deduplicated: only one batch per calendar day.
 */
export function checkInvoiceNotifications(
  invoices: MinimalInvoice[],
  clients: MinimalClient[]
): void {
  if (!isNotificationsEnabled()) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  // Only fire once per day
  const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
  if (lastCheck === todayStr) return;
  localStorage.setItem(LAST_CHECK_KEY, todayStr);

  const pending = invoices.filter(inv => inv.status !== "paid" && inv.status !== "draft");

  const overdue: MinimalInvoice[] = [];
  const dueSoon: MinimalInvoice[] = [];

  for (const inv of pending) {
    const due = new Date(inv.dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);

    if (diffDays < 0) overdue.push(inv);
    else if (diffDays <= 3) dueSoon.push(inv);
  }

  const clientName = (inv: MinimalInvoice) =>
    clients.find(c => c.id === inv.clientId)?.name ?? "Client";

  // Fire notifications with slight delays so they stack
  overdue.forEach((inv, i) => {
    setTimeout(() => {
      showNotification(
        `⚠️ Overdue: ${inv.invoiceNumber}`,
        `${clientName(inv)} — was due on ${inv.dueDate}`,
        `overdue-${inv.invoiceNumber}`
      );
    }, i * 800);
  });

  dueSoon.forEach((inv, i) => {
    const due = new Date(inv.dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);
    const label = diffDays === 0 ? "due today" : `due in ${diffDays} day${diffDays > 1 ? "s" : ""}`;

    setTimeout(() => {
      showNotification(
        `🔔 Invoice ${inv.invoiceNumber} ${label}`,
        `${clientName(inv)} — $${inv.dueDate}`,
        `due-soon-${inv.invoiceNumber}`
      );
    }, (overdue.length + i) * 800);
  });
}
