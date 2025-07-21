/**
 * Validation utility functions for the Todo List application
 * Handles form validation and date range validation
 */

import { isValidDate } from './dateUtils.js';

/**
 * Validate a required field
 * @param {string} value - Field value
 * @returns {Object} Validation result with isValid and message
 */
export function validateRequired(value) {
  const trimmed = typeof value === 'string' ? value.trim() : value;
  const isValid = trimmed !== undefined && trimmed !== null && trimmed !== '';
  
  return {
    isValid,
    message: isValid ? '' : 'This field is required'
  };
}

/**
 * Validate a text field with minimum length
 * @param {string} value - Field value
 * @param {number} minLength - Minimum length required
 * @returns {Object} Validation result with isValid and message
 */
export function validateMinLength(value, minLength = 3) {
  const required = validateRequired(value);
  if (!required.isValid) {
    return required;
  }
  
  const isValid = value.trim().length >= minLength;
  
  return {
    isValid,
    message: isValid ? '' : `Must be at least ${minLength} characters`
  };
}

/**
 * Validate a text field with maximum length
 * @param {string} value - Field value
 * @param {number} maxLength - Maximum length allowed
 * @returns {Object} Validation result with isValid and message
 */
export function validateMaxLength(value, maxLength = 100) {
  const required = validateRequired(value);
  if (!required.isValid) {
    return required;
  }
  
  const isValid = value.trim().length <= maxLength;
  
  return {
    isValid,
    message: isValid ? '' : `Must be no more than ${maxLength} characters`
  };
}

/**
 * Validate a todo title/description
 * @param {string} value - Todo title/description
 * @returns {Object} Validation result with isValid and message
 */
export function validateTodoText(value) {
  const required = validateRequired(value);
  if (!required.isValid) {
    return required;
  }
  
  const minLength = validateMinLength(value, 3);
  if (!minLength.isValid) {
    return minLength;
  }
  
  const maxLength = validateMaxLength(value, 100);
  if (!maxLength.isValid) {
    return maxLength;
  }
  
  return { isValid: true, message: '' };
}

/**
 * Validate a date input
 * @param {string} dateString - Date string to validate
 * @returns {Object} Validation result with isValid and message
 */
export function validateDate(dateString) {
  // Empty date is valid (optional)
  if (!dateString) {
    return { isValid: true, message: '' };
  }
  
  const isValid = isValidDate(dateString);
  
  return {
    isValid,
    message: isValid ? '' : 'Please enter a valid date'
  };
}

/**
 * Validate a date range
 * @param {string} startDateString - Start date string
 * @param {string} endDateString - End date string
 * @returns {Object} Validation result with isValid and message
 */
export function validateDateRange(startDateString, endDateString) {
  // If both dates are empty, range is valid (no filter)
  if (!startDateString && !endDateString) {
    return { isValid: true, message: '' };
  }
  
  // Validate individual dates if provided
  if (startDateString) {
    const startValid = validateDate(startDateString);
    if (!startValid.isValid) {
      return { ...startValid, field: 'startDate' };
    }
  }
  
  if (endDateString) {
    const endValid = validateDate(endDateString);
    if (!endValid.isValid) {
      return { ...endValid, field: 'endDate' };
    }
  }
  
  // If only one date is provided, range is valid
  if ((!startDateString && endDateString) || (startDateString && !endDateString)) {
    return { isValid: true, message: '' };
  }
  
  // Both dates are provided and valid, check if start is before end
  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);
  
  if (startDate > endDate) {
    return { 
      isValid: false, 
      message: 'Start date must be before end date',
      field: 'dateRange'
    };
  }
  
  return { isValid: true, message: '' };
}

/**
 * Validate a form object with multiple fields
 * @param {Object} formData - Form data object
 * @param {Object} validationRules - Validation rules for each field
 * @returns {Object} Validation results with overall isValid and field-specific results
 */
export function validateForm(formData, validationRules) {
  const results = {
    isValid: true,
    fields: {}
  };
  
  // Validate each field according to its rules
  Object.keys(validationRules).forEach(field => {
    const value = formData[field];
    const validator = validationRules[field];
    
    // Apply validation function
    const result = validator(value);
    
    // Store result for this field
    results.fields[field] = result;
    
    // Update overall form validity
    if (!result.isValid) {
      results.isValid = false;
    }
  });
  
  return results;
}

/**
 * Create validation rules for the todo form
 * @returns {Object} Validation rules object
 */
export function createTodoFormValidationRules() {
  return {
    todo: validateTodoText,
    // Add more fields as needed
  };
}

/**
 * Create validation rules for the date filter form
 * @returns {Object} Validation rules object
 */
export function createDateFilterValidationRules() {
  return {
    startDate: validateDate,
    endDate: validateDate
  };
}