/**
 * Date utility functions for the Todo List application
 * Handles date formatting, comparison, validation, and creation date simulation
 */

/**
 * Format a date object to YYYY-MM-DD string
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  if (!(date instanceof Date) || isNaN(date)) {
    return '';
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Parse a date string to a Date object
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Date|null} Date object or null if invalid
 */
export function parseDate(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }
  
  const date = new Date(dateString);
  return isNaN(date) ? null : date;
}

/**
 * Check if a date is valid
 * @param {string|Date} date - Date to validate
 * @returns {boolean} True if valid date
 */
export function isValidDate(date) {
  if (!date) return false;
  
  if (typeof date === 'string') {
    const parsed = new Date(date);
    return !isNaN(parsed);
  }
  
  return date instanceof Date && !isNaN(date);
}

/**
 * Compare two dates
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export function compareDates(date1, date2) {
  if (!isValidDate(date1) || !isValidDate(date2)) {
    throw new Error('Invalid date provided for comparison');
  }
  
  const time1 = date1.getTime();
  const time2 = date2.getTime();
  
  if (time1 < time2) return -1;
  if (time1 > time2) return 1;
  return 0;
}

/**
 * Check if a date is within a range (inclusive)
 * @param {Date} date - Date to check
 * @param {Date|null} startDate - Range start (null means no start limit)
 * @param {Date|null} endDate - Range end (null means no end limit)
 * @returns {boolean} True if date is within range
 */
export function isDateInRange(date, startDate, endDate) {
  if (!isValidDate(date)) {
    return false;
  }
  
  // Convert to midnight for date-only comparison
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  // Check start date if provided
  if (startDate && isValidDate(startDate)) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    if (targetDate < start) return false;
  }
  
  // Check end date if provided
  if (endDate && isValidDate(endDate)) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // End of day
    if (targetDate > end) return false;
  }
  
  return true;
}

/**
 * Validate a date range
 * @param {Date|null} startDate - Range start
 * @param {Date|null} endDate - Range end
 * @returns {Object} Validation result with isValid and message
 */
export function validateDateRange(startDate, endDate) {
  // If both dates are null or undefined, range is valid (no filter)
  if (!startDate && !endDate) {
    return { isValid: true, message: '' };
  }
  
  // If only one date is provided, it's valid
  if ((!startDate && endDate) || (startDate && !endDate)) {
    return { isValid: true, message: '' };
  }
  
  // Both dates are provided, check if start is before end
  if (startDate > endDate) {
    return { 
      isValid: false, 
      message: 'Start date must be before end date' 
    };
  }
  
  return { isValid: true, message: '' };
}

// Local storage keys
const CREATION_DATES_KEY = 'todo_creation_dates';

/**
 * Generate a simulated creation date for a todo
 * @param {number} todoId - Todo ID
 * @returns {Date} Simulated creation date
 */
export function generateCreationDate(todoId) {
  // Base date (30 days ago)
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 30);
  
  // Use todoId to create some variation (newer IDs are newer todos)
  const daysToAdd = todoId % 30;
  const result = new Date(baseDate);
  result.setDate(result.getDate() + daysToAdd);
  
  return result;
}

/**
 * Save a todo's creation date to localStorage
 * @param {number} todoId - Todo ID
 * @param {Date} date - Creation date
 */
export function saveCreationDate(todoId, date) {
  try {
    // Get existing dates
    const datesJson = localStorage.getItem(CREATION_DATES_KEY) || '{}';
    const dates = JSON.parse(datesJson);
    
    // Add or update date
    dates[todoId] = date.toISOString();
    
    // Save back to localStorage
    localStorage.setItem(CREATION_DATES_KEY, JSON.stringify(dates));
  } catch (error) {
    console.error('Error saving creation date to localStorage:', error);
  }
}

/**
 * Get a todo's creation date from localStorage or generate one
 * @param {number} todoId - Todo ID
 * @returns {Date} Creation date
 */
export function getCreationDate(todoId) {
  try {
    // Get existing dates
    const datesJson = localStorage.getItem(CREATION_DATES_KEY) || '{}';
    const dates = JSON.parse(datesJson);
    
    // Return existing date if available
    if (dates[todoId]) {
      return new Date(dates[todoId]);
    }
    
    // Generate and save new date
    const newDate = generateCreationDate(todoId);
    saveCreationDate(todoId, newDate);
    return newDate;
  } catch (error) {
    console.error('Error getting creation date from localStorage:', error);
    return generateCreationDate(todoId);
  }
}

/**
 * Clear all simulated creation dates from localStorage
 */
export function clearCreationDates() {
  try {
    localStorage.removeItem(CREATION_DATES_KEY);
  } catch (error) {
    console.error('Error clearing creation dates from localStorage:', error);
  }
}

/**
 * Format a date for display in the UI
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string (e.g., "Jul 21, 2023")
 */
export function formatDateForDisplay(date) {
  if (!isValidDate(date)) {
    return 'Unknown date';
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}