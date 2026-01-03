// Formatting Utilities

import { CURRENCY_CONFIG } from '@/config/constants';

// Currency formatting

/**
 * Format amount as Ghana Cedis
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(CURRENCY_CONFIG.LOCALE, {
    style: 'currency',
    currency: CURRENCY_CONFIG.CODE,
    minimumFractionDigits: CURRENCY_CONFIG.DECIMAL_PLACES,
    maximumFractionDigits: CURRENCY_CONFIG.DECIMAL_PLACES,
  }).format(amount);
}

/**
 * Format amount with just symbol (shorter format)
 */
export function formatAmount(amount: number): string {
  return `${CURRENCY_CONFIG.SYMBOL}${amount.toFixed(CURRENCY_CONFIG.DECIMAL_PLACES)}`;
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
}

// Date and Time formatting

/**
 * Format date to display format (DD/MM/YYYY)
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Format time to display format (HH:mm)
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return 'Invalid time';
  }
  
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

/**
 * Format datetime to display format (DD/MM/YYYY HH:mm)
 */
export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * Format date for API (YYYY-MM-DD)
 */
export function formatDateForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Format datetime for API (ISO format)
 */
export function formatDateTimeForAPI(date: Date): string {
  return date.toISOString();
}

/**
 * Get relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSecs = Math.round(diffMs / 1000);
  const diffMins = Math.round(diffSecs / 60);
  const diffHours = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHours / 24);
  
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  
  if (Math.abs(diffSecs) < 60) {
    return rtf.format(diffSecs, 'second');
  }
  if (Math.abs(diffMins) < 60) {
    return rtf.format(diffMins, 'minute');
  }
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, 'hour');
  }
  if (Math.abs(diffDays) < 30) {
    return rtf.format(diffDays, 'day');
  }
  
  return formatDate(d);
}

/**
 * Check if date is overdue
 */
export function isOverdue(dueDate: Date | string): boolean {
  const d = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  return d < new Date();
}

/**
 * Get days until/since date
 */
export function getDaysUntil(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// Phone number formatting

/**
 * Format Ghana phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  // Remove non-digits except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Format as +233 XX XXX XXXX
  if (cleaned.startsWith('+233') && cleaned.length === 13) {
    return `+233 ${cleaned.slice(4, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  
  // Format as 0XX XXX XXXX
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  
  return phone;
}

// Vehicle registration formatting

/**
 * Format vehicle registration for display
 */
export function formatVehicleReg(reg: string): string {
  // Remove existing separators and convert to uppercase
  const cleaned = reg.replace(/[\s-]/g, '').toUpperCase();
  
  // Format as XX-0000-00
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  
  return reg.toUpperCase();
}

// Ticket number formatting

/**
 * Format ticket number for display
 */
export function formatTicketNumber(ticketNumber: string): string {
  // Ensure proper format: GPS-XXXXXX-XXXX
  if (ticketNumber.includes('-')) {
    return ticketNumber;
  }
  
  // If it's just digits, format it
  const cleaned = ticketNumber.replace(/[^A-Z0-9]/gi, '');
  if (cleaned.length >= 10) {
    return `GPS-${cleaned.slice(0, 6)}-${cleaned.slice(6, 10)}`;
  }
  
  return ticketNumber;
}

// Name formatting

/**
 * Format name (Title Case)
 */
export function formatName(name: string): string {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Number formatting

/**
 * Format number with thousands separator
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-GH').format(num);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// Address formatting

/**
 * Format location for display
 */
export function formatLocation(location: { latitude: number; longitude: number; address?: string; landmark?: string }): string {
  if (location.address) {
    if (location.landmark) {
      return `${location.address} (Near ${location.landmark})`;
    }
    return location.address;
  }
  
  if (location.landmark) {
    return `Near ${location.landmark}`;
  }
  
  return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
}

// Truncate text

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}

// File size formatting

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
