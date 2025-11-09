/**
 * Utility functions for formatting data consistently across the application
 */

/**
 * Format prize amount in USD currency
 * IMPORTANT: All prize amounts in database are stored in cents (integer)
 * This function divides by 100 to convert to dollars
 *
 * @param amountInCents - Prize amount in cents
 * @returns Formatted currency string (e.g., "$10,000")
 */
export const formatPrize = (amountInCents: number | null | undefined): string => {
  if (!amountInCents || amountInCents === 0) return 'TBD';

  const amountInDollars = amountInCents / 100;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountInDollars);
};

/**
 * Format date for display
 *
 * @param date - ISO date string or Date object
 * @param style - Format style (short, medium, long, full)
 * @returns Formatted date string
 */
export const formatDate = (
  date: string | Date,
  style: 'short' | 'medium' | 'long' = 'medium'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions = {
    short: { month: 'short', day: 'numeric', year: 'numeric' },
    medium: { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' },
    long: {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    },
  }[style];

  return dateObj.toLocaleDateString('en-US', options);
};

/**
 * Calculate days left until deadline
 *
 * @param deadline - ISO date string or Date object
 * @returns Number of days remaining (negative if past deadline)
 */
export const getDaysLeft = (deadline: string | Date): number => {
  const now = new Date();
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Format days left into human-readable string
 *
 * @param deadline - ISO date string or Date object
 * @returns Formatted string (e.g., "5 days left", "Deadline passed")
 */
export const formatDaysLeft = (deadline: string | Date): string => {
  const days = getDaysLeft(deadline);

  if (days < 0) return 'Deadline passed';
  if (days === 0) return 'Due today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
};

/**
 * Format file size in human-readable format
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Truncate text to specified length with ellipsis
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};
