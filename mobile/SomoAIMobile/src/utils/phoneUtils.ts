/**
 * Phone Number Utilities
 *
 * Utilities for validating and formatting Kenyan phone numbers.
 * Kenyan phone numbers follow the format: +254 7XX XXX XXX or +254 1XX XXX XXX
 */

/**
 * Validates Kenyan phone number format
 * Accepts: +254712345678 or 254712345678 or 0712345678
 *
 * @param phone - Phone number to validate
 * @returns true if valid Kenyan phone number
 *
 * @example
 * validateKenyanPhone('+254712345678') // true
 * validateKenyanPhone('0712345678') // true
 * validateKenyanPhone('254712345678') // true
 * validateKenyanPhone('12345') // false
 */
export function validateKenyanPhone(phone: string): boolean {
  if (!phone) return false;

  // Remove spaces and formatting
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Check if it matches Kenyan phone pattern
  const patterns = [
    /^\+254[17]\d{8}$/, // +254 7XX XXX XXX or +254 1XX XXX XXX
    /^254[17]\d{8}$/, // 254 7XX XXX XXX
    /^0[17]\d{8}$/, // 07XX XXX XXX or 01XX XXX XXX
  ];

  return patterns.some(pattern => pattern.test(cleaned));
}

/**
 * Formats Kenyan phone number for display
 * Converts: 254712345678 → +254 712 345 678
 *
 * @param phone - Phone number to format
 * @returns Formatted phone number
 *
 * @example
 * formatKenyanPhone('254712345678') // '+254 712 345 678'
 * formatKenyanPhone('0712345678') // '+254 712 345 678'
 */
export function formatKenyanPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  // Handle different input formats
  let digits = cleaned;
  if (digits.startsWith('254')) {
    digits = digits;
  } else if (digits.startsWith('0')) {
    digits = '254' + digits.slice(1);
  } else if (digits.startsWith('7') || digits.startsWith('1')) {
    digits = '254' + digits;
  }

  // Format: +254 7XX XXX XXX
  if (digits.length >= 3) {
    let formatted = '+254';
    const rest = digits.slice(3);

    if (rest.length > 0) formatted += ' ' + rest.slice(0, 3);
    if (rest.length > 3) formatted += ' ' + rest.slice(3, 6);
    if (rest.length > 6) formatted += ' ' + rest.slice(6, 9);

    return formatted;
  }

  return digits ? '+' + digits : '';
}

/**
 * Normalizes phone to E.164 format for API
 * Returns: +254712345678
 *
 * @param phone - Phone number to normalize
 * @returns Normalized phone number in E.164 format
 *
 * @example
 * normalizeKenyanPhone('0712345678') // '+254712345678'
 * normalizeKenyanPhone('254712345678') // '+254712345678'
 */
export function normalizeKenyanPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('254')) {
    return '+' + cleaned;
  } else if (cleaned.startsWith('0')) {
    return '+254' + cleaned.slice(1);
  } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    return '+254' + cleaned;
  }

  return phone;
}

/**
 * Masks phone number for display
 * Converts: +254712345678 → +254 712 *** ***
 *
 * @param phone - Phone number to mask
 * @returns Masked phone number
 *
 * @example
 * maskKenyanPhone('+254712345678') // '+254 712 *** ***'
 */
export function maskKenyanPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length >= 6) {
    const countryCode = cleaned.slice(0, 3); // 254
    const prefix = cleaned.slice(3, 6); // 712
    return `+${countryCode} ${prefix} *** ***`;
  }

  return phone;
}
