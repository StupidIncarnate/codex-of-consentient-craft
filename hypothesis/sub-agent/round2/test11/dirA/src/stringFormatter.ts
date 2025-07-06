/**
 * String formatting utilities for mobile applications
 */

/**
 * Formats a phone number to a standard display format
 * @param phoneNumber - Raw phone number string
 * @returns Formatted phone number (XXX) XXX-XXXX
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Check if we have exactly 10 digits
  if (digits.length !== 10) {
    throw new Error('Phone number must contain exactly 10 digits');
  }
  
  // Format as (XXX) XXX-XXXX
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/**
 * Truncates text with ellipsis for mobile display
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Capitalizes the first letter of each word
 * @param text - Text to capitalize
 * @returns Title case text
 */
export function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}