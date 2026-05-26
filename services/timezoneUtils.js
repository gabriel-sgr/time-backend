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

module.exports = {
  formatDateForKigali,
  getCurrentKigaliTime,
  toKigaliDateString,
  toKigaliDate,
  toKigaliTime
};
