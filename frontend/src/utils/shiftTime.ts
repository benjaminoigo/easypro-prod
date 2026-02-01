/**
 * Calculate time remaining until shift end
 * @param endTime - ISO string of shift end time
 * @returns Formatted string like "5h 30m"
 */
export const getTimeRemaining = (endTime: string): string => {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end.getTime() - now.getTime();
  
  if (diff <= 0) return '0h 0m';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
};

/**
 * Format shift time for display
 * @param time - ISO string of time
 * @returns Formatted time like "9:00 AM"
 */
export const formatShiftTime = (time: string): string => {
  return new Date(time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Check if current time is within shift hours
 * @param startTime - ISO string of shift start
 * @param endTime - ISO string of shift end
 * @returns boolean
 */
export const isWithinShiftHours = (startTime: string, endTime: string): boolean => {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  return now >= start && now <= end;
};

/**
 * Get shift progress percentage
 * @param startTime - ISO string of shift start
 * @param endTime - ISO string of shift end
 * @returns number between 0 and 100
 */
export const getShiftProgress = (startTime: string, endTime: string): number => {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  
  const progress = (elapsed / total) * 100;
  return Math.max(0, Math.min(100, progress));
};
