import { Expense } from '../types';

/**
 * Request browser notification permission.
 * Returns true if granted, false otherwise.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

/**
 * Check current notification permission status.
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/**
 * Show a browser notification immediately.
 */
export function showBrowserNotification(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'reimbursement-reminder',
    });
  } catch (e) {
    console.warn('Could not show browser notification:', e);
  }
}

/**
 * Given the full list of expenses, return those that are:
 * - isReimbursable = true
 * - not yet resolved
 * - reimbursementReminderDate <= today (i.e. due or overdue)
 */
export function getDueReminders(expenses: Expense[]): Expense[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return expenses.filter(exp => {
    if (!exp.isReimbursable) return false;
    if (exp.isResolved) return false;
    if (!exp.reimbursementReminderDate) return false;
    const reminderDate = new Date(exp.reimbursementReminderDate + 'T00:00:00');
    return reminderDate <= today;
  });
}

/**
 * Key used to track which reminder IDs we already notified about this session.
 */
const SESSION_NOTIFIED_KEY = 'reimb_notified_session';

export function getSessionNotifiedIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SESSION_NOTIFIED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function markSessionNotified(ids: string[]) {
  try {
    const existing = getSessionNotifiedIds();
    ids.forEach(id => existing.add(id));
    sessionStorage.setItem(SESSION_NOTIFIED_KEY, JSON.stringify([...existing]));
  } catch {
    // ignore
  }
}

/**
 * Check due reminders and fire browser notifications for new ones.
 * Tracks which expenses have already been notified this session to avoid duplicates.
 */
export function triggerDueReminderNotifications(
  expenses: Expense[],
  formatAmount: (amount: number) => string
) {
  const due = getDueReminders(expenses);
  if (due.length === 0) return;

  const alreadyNotified = getSessionNotifiedIds();
  const newDue = due.filter(exp => exp.id && !alreadyNotified.has(exp.id));
  if (newDue.length === 0) return;

  markSessionNotified(newDue.map(e => e.id!));

  if (newDue.length === 1) {
    const exp = newDue[0];
    const amount = formatAmount(exp.amount);
    showBrowserNotification(
      '💸 Nhắc hoàn tiền',
      `${exp.note || exp.category} — ${amount} đã đến hạn nhận lại tiền.`
    );
  } else {
    showBrowserNotification(
      `💸 ${newDue.length} khoản cần hoàn tiền`,
      `Bạn có ${newDue.length} khoản chi ứng trước đã đến hạn nhận lại tiền.`
    );
  }
}
