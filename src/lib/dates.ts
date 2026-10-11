/**
 * Remnexa - Centralized Date & Expiry Status Utility
 *
 * All expiry status calculations go through this module.
 * Uses date-only comparison with local calendar semantics.
 * No timezone conversions that could shift a date by one day.
 */

export type ExpiryStatus = 'overdue' | 'expires_today' | 'urgent' | 'upcoming' | 'later';

export interface ExpiryInfo {
  status: ExpiryStatus;
  label: string;
  daysRemaining: number; // negative for overdue, 0 for today, positive for future
}

// Default thresholds (configurable in one place)
const THRESHOLDS = {
  URGENT_MAX_DAYS: 7,
  UPCOMING_MAX_DAYS: 30,
} as const;

/**
 * Parse a date-only string (YYYY-MM-DD) into a Date at midnight local time.
 * Returns null if invalid.
 */
export function parseDateOnly(dateStr: string): Date | null {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return null;
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  // Validate the date is real (handles month boundaries, leap years)
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }
  return d;
}

/**
 * Get today's date at midnight local time, with no time component.
 */
export function getToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Calculate calendar days between two date-only dates.
 * Uses Math.round to handle DST transitions safely.
 */
export function daysBetween(from: Date, to: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const fromMidnight = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const toMidnight = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((toMidnight.getTime() - fromMidnight.getTime()) / msPerDay);
}

/**
 * Get the expiry status and info for a given expiry date string.
 */
export function getExpiryInfo(expiryDateStr: string): ExpiryInfo | null {
  const expiryDate = parseDateOnly(expiryDateStr);
  if (!expiryDate) return null;

  const today = getToday();
  const daysRemaining = daysBetween(today, expiryDate);

  let status: ExpiryStatus;
  let label: string;

  if (daysRemaining < 0) {
    status = 'overdue';
    label = `${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''} overdue`;
  } else if (daysRemaining === 0) {
    status = 'expires_today';
    label = 'Expires today';
  } else if (daysRemaining <= THRESHOLDS.URGENT_MAX_DAYS) {
    status = 'urgent';
    label = `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`;
  } else if (daysRemaining <= THRESHOLDS.UPCOMING_MAX_DAYS) {
    status = 'upcoming';
    label = `${daysRemaining} days remaining`;
  } else {
    status = 'later';
    label = `${daysRemaining} days remaining`;
  }

  return { status, label, daysRemaining };
}

/**
 * Get a human-readable status badge label.
 */
export function getStatusLabel(status: ExpiryStatus): string {
  switch (status) {
    case 'overdue': return 'Overdue';
    case 'expires_today': return 'Expires today';
    case 'urgent': return 'Urgent';
    case 'upcoming': return 'Upcoming';
    case 'later': return 'Valid';
  }
}

/**
 * Map status to CSS class.
 */
export function getStatusClass(status: ExpiryStatus): string {
  switch (status) {
    case 'overdue':
    case 'expires_today':
      return 'status-overdue';
    case 'urgent':
      return 'status-urgent';
    case 'upcoming':
      return 'status-upcoming';
    case 'later':
      return 'status-valid';
  }
}

/**
 * Checks if a status needs attention (overdue, expires today, or urgent).
 */
export function needsAttention(status: ExpiryStatus): boolean {
  return status === 'overdue' || status === 'expires_today' || status === 'urgent';
}

/**
 * Format a date string (YYYY-MM-DD) for display.
 */
export function formatDate(dateStr: string): string {
  const d = parseDateOnly(dateStr);
  if (!d) return dateStr;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a Firestore timestamp or ISO string to display format.
 */
export function formatTimestamp(ts: unknown): string {
  if (!ts) return '';
  // Firestore Timestamp
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
    const d = (ts as { toDate: () => Date }).toDate();
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  // ISO string
  if (typeof ts === 'string') {
    const d = new Date(ts);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }
  return String(ts);
}

/**
 * Validate a URL string.
 */
export function isValidUrl(url: string): boolean {
  if (!url) return true; // optional field
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Get today's date as YYYY-MM-DD string.
 */
export function getTodayString(): string {
  const today = getToday();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
