/**
 * Timezone Utility Functions
 * Ensures all dates are handled in Kigali, Rwanda timezone (Africa/Kigali - UTC+3)
 */

/**
 * Formats a date to ISO string with Kigali timezone
 * @param {Date} date - The date to format
 * @returns {string} - ISO string representation
 */
const formatDateForKigali = (date) => {
  if (!date) return null;
  
  const dateObj = new Date(date);
  
  // Format the date in Kigali timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Kigali',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(dateObj);
  const result = {};
  
  parts.forEach(({ type, value }) => {
    result[type] = value;
  });
  
  return `${result.year}-${result.month}-${result.day}T${result.hour}:${result.minute}:${result.second}Z`;
};

/**
 * Gets current time in Kigali timezone
 * @returns {Date} - Current date object
 */
const getCurrentKigaliTime = () => {
  return new Date();
};

/**
 * Converts a date to Kigali local time string
 * @param {Date} date - The date to convert
 * @returns {string} - Human readable date in Kigali timezone
 */
const toKigaliDateString = (date) => {
  if (!date) return null;
  
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Kigali',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(date));
};

/**
 * Converts a date to Kigali local date only (no time)
 * @param {Date} date - The date to convert
 * @returns {string} - Date string in Kigali timezone
 */
const toKigaliDate = (date) => {
  if (!date) return null;
  
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Kigali',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(date));
};

/**
 * Converts a date to Kigali local time only (no date)
 * @param {Date} date - The date to convert
 * @returns {string} - Time string in Kigali timezone
 */
const toKigaliTime = (date) => {
  if (!date) return null;
  
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Kigali',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(new Date(date));
};

/**
 * Gets current time in HH:MM format in Kigali timezone
 * @returns {string} - Current time in HH:MM format
 */
const getCurrentKigaliTimeHHMM = () => {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Kigali',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return formatter.format(new Date());
};

/**
 * Gets current day of week in Kigali timezone
 * @returns {number} - Day of week (1=Monday, 7=Sunday)
 */
const getCurrentKigaliDay = () => {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Kigali',
    weekday: 'long'
  });
  const dayName = formatter.format(new Date());
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayIndex = days.indexOf(dayName);
  return dayIndex === 0 ? 7 : dayIndex; // 1=Mon..7=Sun
};

/**
 * Gets current date start and end in Kigali timezone
 * @returns {Object} - { start: Date, end: Date } for today in Kigali timezone
 */
const getTodayKigaliDateRange = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Kigali',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const dateStr = formatter.format(new Date());
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Create dates in UTC that represent the Kigali dates
  // Note: This is approximate and works for display purposes
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
  
  return { start, end };
};

module.exports = {
  formatDateForKigali,
  getCurrentKigaliTime,
  toKigaliDateString,
  toKigaliDate,
  toKigaliTime,
  getCurrentKigaliTimeHHMM,
  getCurrentKigaliDay,
  getTodayKigaliDateRange
};
