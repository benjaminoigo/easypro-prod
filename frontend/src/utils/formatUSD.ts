/**
 * Format a number as USD currency
 * @param amount - The amount to format
 * @returns Formatted string like "$1,234.56"
 */
export const formatUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format a number as USD currency without cents
 * @param amount - The amount to format
 * @returns Formatted string like "$1,234"
 */
export const formatUSDShort = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
