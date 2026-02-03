/**
 * Format a number as KES (Kenyan Shillings) currency
 * @param amount - The amount to format
 * @returns Formatted string like "KSh 1,234.56"
 */
export const formatUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format a number as KES currency without cents
 * @param amount - The amount to format
 * @returns Formatted string like "KSh 1,234"
 */
export const formatUSDShort = (amount: number): string => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
