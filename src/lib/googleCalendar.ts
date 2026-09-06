import { Expense } from '../types';
import { formatCurrency } from './utils';
import {
  requestNotificationPermission,
  getNotificationPermission,
} from './notifications';

// ─── Notification-based "connection" state ─────────────────────────────────
// We repurpose the old "google_calendar_connected" key so that existing
// Firestore settings (calendarAutoSync) and UI state continue to work.
const NOTIF_CONNECTED_KEY = 'google_calendar_connected';

/**
 * Check if the user has enabled reimbursement reminders (notification permission granted).
 */
export function isGoogleCalendarConnected(): boolean {
  try {
    if (localStorage.getItem(NOTIF_CONNECTED_KEY) !== 'true') return false;
    // Also verify browser permission is still granted
    return getNotificationPermission() === 'granted';
  } catch {
    return false;
  }
}

/**
 * Enable reminders: request browser notification permission.
 * Returns a token-like string for interface compatibility.
 */
export async function connectGoogleCalendar(): Promise<string> {
  const granted = await requestNotificationPermission();
  if (!granted) {
    if (getNotificationPermission() === 'denied') {
      throw new Error(
        'Trình duyệt đang chặn thông báo. Vui lòng vào Cài đặt trình duyệt → Quyền riêng tư → Thông báo → cho phép trang này gửi thông báo.'
      );
    }
    throw new Error('Bạn cần cho phép thông báo để bật tính năng nhắc hoàn tiền.');
  }
  try {
    localStorage.setItem(NOTIF_CONNECTED_KEY, 'true');
  } catch { /* ignore */ }
  return 'notification-enabled';
}

/**
 * Disable reminders (clear local flag; browser permission stays but we won't use it).
 */
export function disconnectGoogleCalendar(): void {
  try {
    localStorage.removeItem(NOTIF_CONNECTED_KEY);
  } catch { /* ignore */ }
}

// ─── Legacy token helpers (kept as no-ops for interface compatibility) ───────
export function getCalendarAccessToken(): string | null { return null; }
export function setCalendarAccessToken(_token: string) { /* no-op */ }



/**
 * Calculate target reminder date (YYYY-MM-DD)
 */
export function calculateReminderDate(expenseDate: string, daysOffset: number = 3): string {
  try {
    const d = new Date(expenseDate);
    if (isNaN(d.getTime())) {
      const now = new Date();
      now.setDate(now.getDate() + daysOffset);
      return now.toISOString().split('T')[0];
    }
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  } catch (e) {
    const now = new Date();
    now.setDate(now.getDate() + daysOffset);
    return now.toISOString().split('T')[0];
  }
}

export interface CalendarSyncResult {
  eventId: string;
  htmlLink?: string;
}

/**
 * Creates a "reminder" (now handled purely client-side via Web Notifications).
 * Returns a fake eventId so the app knows it's been processed.
 */
export async function createCalendarReminderEvent(
  expense: Expense,
  _reminderDays: number = 3
): Promise<CalendarSyncResult> {
  if (!isGoogleCalendarConnected()) {
    await connectGoogleCalendar();
  }
  
  // Return a local marker ID so App.tsx marks this expense as "synced"
  return { 
    eventId: `web-notif-${expense.id || Date.now()}`,
    htmlLink: undefined
  };
}

/**
 * Update an existing reminder event.
 * No-op for Web Notifications since they are evaluated on the fly based on Firestore data.
 */
export async function updateCalendarReminderEvent(
  _eventId: string,
  _expense: Expense
): Promise<void> {
  // No-op
}

/**
 * Delete a reminder event.
 * No-op for Web Notifications.
 */
export async function deleteCalendarReminderEvent(_eventId: string): Promise<void> {
  // No-op
}

/**
 * Generate a direct 1-click Google Calendar web creation URL.
 * Works 100% reliably for ALL Google accounts without requiring any OAuth permissions or verification!
 */
export function createGoogleCalendarUrl(expense: Expense, reminderDays: number = 3): string {
  const reminderDateStr = expense.reimbursementReminderDate || calculateReminderDate(expense.date, reminderDays);
  // YYYYMMDD format for all-day events
  const cleanDate = reminderDateStr.replace(/-/g, '');
  const formattedAmount = formatCurrency(expense.amount, expense.currency);
  const statusText = expense.isResolved ? 'Đã hoàn tiền ✓' : 'Chờ hoàn tiền';
  
  const text = encodeURIComponent(
    expense.isResolved 
      ? `[Đã hoàn tiền ✓] ${expense.note || expense.category} - ${formattedAmount}`
      : `[Nhắc hoàn tiền] ${expense.note || expense.category} - ${formattedAmount}`
  );
  
  const details = encodeURIComponent(
    `💰 THÔNG TIN KHOẢN TIỀN CẦN HOÀN:\n` +
    `• Số tiền: ${formattedAmount}\n` +
    `• Danh mục: ${expense.category}\n` +
    `• Ghi chú: ${expense.note || '(Không có)'}\n` +
    `• Ngày chi: ${expense.date}\n` +
    `• Trạng thái: ${statusText}\n\n` +
    `Tạo từ Expense Tracker Liquid Glass.`
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${cleanDate}/${cleanDate}&details=${details}`;
}

/**
 * Download a standard .ics calendar file for Apple Calendar, Google Calendar, Outlook, etc.
 */
export function downloadICalendarFile(expense: Expense, reminderDays: number = 3): void {
  const reminderDateStr = expense.reimbursementReminderDate || calculateReminderDate(expense.date, reminderDays);
  const cleanDate = reminderDateStr.replace(/-/g, '');
  const formattedAmount = formatCurrency(expense.amount, expense.currency);
  const statusText = expense.isResolved ? 'Đã hoàn tiền ✓' : 'Chờ hoàn tiền';
  const summary = expense.isResolved 
    ? `[Đã hoàn tiền] ${expense.note || expense.category} - ${formattedAmount}`
    : `[Nhắc hoàn tiền] ${expense.note || expense.category} - ${formattedAmount}`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Expense Tracker Liquid Glass//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:expense-${expense.id}-${Date.now()}@expensetracker.app`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART;VALUE=DATE:${cleanDate}`,
    `DTEND;VALUE=DATE:${cleanDate}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:So tien: ${formattedAmount}\\nDanh muc: ${expense.category}\\nGhi chu: ${expense.note || ''}\\nTrang thai: ${statusText}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Nhắc nhở hoàn tiền chi tiêu',
    'TRIGGER:-PT9H',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `remind-reimburse-${cleanDate}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

