import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';
import { Expense } from '../types';
import { formatCurrency } from './utils';

const CALENDAR_TOKEN_KEY = 'google_calendar_token';
const CALENDAR_CONNECTED_KEY = 'google_calendar_connected';

/**
 * Get stored Google Calendar OAuth access token
 */
export function getCalendarAccessToken(): string | null {
  try {
    return sessionStorage.getItem(CALENDAR_TOKEN_KEY) || localStorage.getItem(CALENDAR_TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

/**
 * Save access token to storage
 */
export function setCalendarAccessToken(token: string) {
  try {
    sessionStorage.setItem(CALENDAR_TOKEN_KEY, token);
    localStorage.setItem(CALENDAR_TOKEN_KEY, token);
    localStorage.setItem(CALENDAR_CONNECTED_KEY, 'true');
  } catch (e) {
    console.error('Error saving calendar token', e);
  }
}

/**
 * Check if Google Calendar is marked as connected
 */
export function isGoogleCalendarConnected(): boolean {
  try {
    return localStorage.getItem(CALENDAR_CONNECTED_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

/**
 * Disconnect Google Calendar
 */
export function disconnectGoogleCalendar(): void {
  try {
    sessionStorage.removeItem(CALENDAR_TOKEN_KEY);
    localStorage.removeItem(CALENDAR_TOKEN_KEY);
    localStorage.removeItem(CALENDAR_CONNECTED_KEY);
  } catch (e) {
    console.error('Error disconnecting calendar', e);
  }
}

/**
 * Request Google Calendar OAuth permissions via Firebase Auth popup
 */
export async function connectGoogleCalendar(): Promise<string> {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/calendar.events');
  provider.setCustomParameters({
    prompt: 'consent'
  });

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;

    if (!token) {
      throw new Error('Không nhận được mã truy cập OAuth từ Google. Vui lòng thử lại.');
    }

    setCalendarAccessToken(token);
    return token;
  } catch (error: any) {
    console.error('Error connecting Google Calendar:', error);
    throw error;
  }
}

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
 * Create a reminder event on Google Calendar for a reimbursable expense
 */
export async function createCalendarReminderEvent(
  expense: Expense,
  reminderDays: number = 3
): Promise<CalendarSyncResult> {
  let token = getCalendarAccessToken();
  if (!token) {
    // If not in storage, prompt connection
    token = await connectGoogleCalendar();
  }

  const reminderDate = expense.reimbursementReminderDate || calculateReminderDate(expense.date, reminderDays);
  const formattedAmount = formatCurrency(expense.amount, expense.currency);
  const statusText = expense.isResolved ? 'Đã hoàn tiền ✓' : 'Chờ hoàn tiền';
  const summary = expense.isResolved 
    ? `[Đã hoàn tiền ✓] ${expense.note || expense.category} - ${formattedAmount}`
    : `[Nhắc hoàn tiền] ${expense.note || expense.category} - ${formattedAmount}`;

  const description = [
    `💰 THÔNG TIN KHOẢN TIỀN CẦN HOÀN:`,
    `• Số tiền: ${formattedAmount}`,
    `• Danh mục: ${expense.category}`,
    `• Ghi chú: ${expense.note || '(Không có ghi chú)'}`,
    `• Ngày chi tiêu ban đầu: ${expense.date}`,
    `• Trạng thái hiện tại: ${statusText}`,
    ``,
    `📅 Sự kiện được đồng bộ tự động từ Expense Tracker Liquid Glass.`
  ].join('\n');

  const eventPayload = {
    summary,
    description,
    start: {
      date: reminderDate
    },
    end: {
      date: reminderDate
    },
    colorId: expense.isResolved ? '10' : '11', // 10 is green (Basil), 11 is red/flamingo
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 540 },  // 9:00 AM on the day
        { method: 'email', minutes: 1440 }  // 1 day before
      ]
    }
  };

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventPayload)
  });

  if (response.status === 401) {
    // Token expired, re-authenticate
    token = await connectGoogleCalendar();
    const retryRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventPayload)
    });
    if (!retryRes.ok) {
      const err = await retryRes.json();
      throw new Error(err?.error?.message || 'Không thể tạo sự kiện trên Google Calendar.');
    }
    const data = await retryRes.json();
    return { eventId: data.id, htmlLink: data.htmlLink };
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Không thể tạo sự kiện trên Google Calendar.');
  }

  const data = await response.json();
  return { eventId: data.id, htmlLink: data.htmlLink };
}

/**
 * Update an existing reminder event (e.g. when marked as resolved/unresolved)
 */
export async function updateCalendarReminderEvent(
  eventId: string,
  expense: Expense
): Promise<void> {
  let token = getCalendarAccessToken();
  if (!token) return;

  const formattedAmount = formatCurrency(expense.amount, expense.currency);
  const statusText = expense.isResolved ? 'Đã hoàn tiền ✓' : 'Chờ hoàn tiền';
  const summary = expense.isResolved 
    ? `[Đã hoàn tiền ✓] ${expense.note || expense.category} - ${formattedAmount}`
    : `[Nhắc hoàn tiền] ${expense.note || expense.category} - ${formattedAmount}`;

  const description = [
    `💰 THÔNG TIN KHOẢN TIỀN CẦN HOÀN:`,
    `• Số tiền: ${formattedAmount}`,
    `• Danh mục: ${expense.category}`,
    `• Ghi chú: ${expense.note || '(Không có ghi chú)'}`,
    `• Ngày chi tiêu ban đầu: ${expense.date}`,
    `• Trạng thái hiện tại: ${statusText}`,
    ``,
    `📅 Sự kiện được đồng bộ tự động từ Expense Tracker Liquid Glass.`
  ].join('\n');

  const patchPayload = {
    summary,
    description,
    colorId: expense.isResolved ? '10' : '11',
  };

  try {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(patchPayload)
    });

    if (response.status === 401) {
      token = await connectGoogleCalendar();
      await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(patchPayload)
      });
    }
  } catch (err) {
    console.warn('Could not update Google Calendar event:', err);
  }
}

/**
 * Delete a reminder event from Google Calendar
 */
export async function deleteCalendarReminderEvent(eventId: string): Promise<void> {
  let token = getCalendarAccessToken();
  if (!token) return;

  try {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      token = await connectGoogleCalendar();
      await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    }
  } catch (err) {
    console.warn('Could not delete Google Calendar event:', err);
  }
}
