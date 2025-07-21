/**
 * ApiService - A wrapper for making HTTP requests
 * Provides standardized error handling and response parsing
 */
export default class ApiService {
  /**
   * Creates a new ApiService instance
   * @param {Object} options - Configuration options
   * @param {string} options.baseUrl - Base URL for API requests
   * @param {Object} options.defaultHeaders - Default headers to include with requests
   * @param {number} options.timeout - Request timeout in milliseconds
   */
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || '';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.defaultHeaders
    };
    this.timeout = options.timeout || 10000; // Default 10s timeout
  }

  /**
   * Makes a GET request to the specified endpoint
   * @param {string} endpoint - API endpoint to call
   * @param {Object} options - Request options
   * @param {Object} options.params - URL parameters to include
   * @param {Object} options.headers - Additional headers to include
   * @returns {Promise<any>} - Parsed response data
   */
  async get(endpoint, options = {}) {
    const url = this._buildUrl(endpoint, options.params);
    const requestOptions = {
      method: 'GET',
      headers: { ...this.defaultHeaders, ...options.headers }
    };

    return this._fetchWithTimeout(url, requestOptions);
  }

  /**
   * Makes a POST request to the specified endpoint
   * @param {string} endpoint - API endpoint to call
   * @param {Object} data - Data to send in request body
   * @param {Object} options - Request options
   * @param {Object} options.headers - Additional headers to include
   * @returns {Promise<any>} - Parsed response data
   */
  async post(endpoint, data, options = {}) {
    const url = this._buildUrl(endpoint);
    const requestOptions = {
      method: 'POST',
      headers: { ...this.defaultHeaders, ...options.headers },
      body: JSON.stringify(data)
    };

    return this._fetchWithTimeout(url, requestOptions);
  }

  /**
   * Builds a URL with query parameters
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {string} - Complete URL
   * @private
   */
  _buildUrl(endpoint, params = {}) {
    const url = new URL(this.baseUrl + endpoint);
    
    // Add query parameters
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });
    }
    
    return url.toString();
  }

  /**
   * Executes a fetch request with timeout
   * @param {string} url - URL to fetch
   * @param {Object} options - Fetch options
   * @returns {Promise<any>} - Parsed response data
   * @private
   */
  async _fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const { signal } = controller;
    
    // Set up timeout
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, { ...options, signal });
      clearTimeout(timeoutId);
      
      // Handle HTTP error responses
      if (!response.ok) {
        return this._handleErrorResponse(response);
      }
      
      // Parse response based on content type
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return data;
      } else {
        const text = await response.text();
        return text;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      return this._handleNetworkError(error, url);
    }
  }

  /**
   * Handles HTTP error responses
   * @param {Response} response - Fetch Response object
   * @returns {Promise<never>} - Rejected promise with error details
   * @private
   */
  async _handleErrorResponse(response) {
    let errorData = {};
    
    try {
      // Try to parse error response as JSON
      errorData = await response.json();
    } catch (e) {
      // If parsing fails, use text response
      errorData = { message: await response.text() };
    }
    
    const error = new Error(errorData.message || 'API request failed');
    error.status = response.status;
    error.statusText = response.statusText;
    error.data = errorData;
    error.response = response;
    
    // Standardize error format
    error.standardized = {
      code: response.status,
      message: this._getErrorMessage(response.status, errorData),
      retryable: this._isErrorRetryable(response.status)
    };
    
    throw error;
  }

  /**
   * Handles network errors (offline, timeout, etc.)
   * @param {Error} error - Original error
   * @param {string} url - Request URL
   * @returns {Promise<never>} - Rejected promise with error details
   * @private
   */
  _handleNetworkError(error, url) {
    // Determine error type
    let errorType = 'NETWORK_ERROR';
    let message = 'Network error occurred';
    let retryable = true;
    let actionSuggestion = 'Please check your internet connection and try again.';
    
    if (error.name === 'AbortError') {
      errorType = 'TIMEOUT';
      message = `Request timed out after ${this.timeout}ms`;
      actionSuggestion = 'The server is taking too long to respond. Please try again later.';
    } else if (!navigator.onLine) {
      errorType = 'OFFLINE';
      message = 'You appear to be offline';
      actionSuggestion = 'Please check your internet connection and try again.';
    } else if (error.message && error.message.includes('Failed to fetch')) {
      errorType = 'CONNECTION_REFUSED';
      message = 'Unable to connect to the server';
      actionSuggestion = 'The server might be down or unreachable. Please try again later.';
    }
    
    // Create a more user-friendly message
    const userFriendlyMessage = `${message}. ${actionSuggestion}`;
    
    // Enhance error with additional information
    error.type = errorType;
    error.url = url;
    error.standardized = {
      code: errorType,
      message: userFriendlyMessage,
      retryable,
      actionSuggestion
    };
    
    // Log the error for debugging
    console.error(`Network error (${errorType}):`, error);
    
    // Add automatic retry for offline errors when online status changes
    if (errorType === 'OFFLINE') {
      window.addEventListener('online', () => {
        console.log('Connection restored. You can retry your request now.');
        // Dispatch a custom event that can be listened for in the app
        const event = new CustomEvent('network:online');
        document.dispatchEvent(event);
      }, { once: true });
    }
    
    throw error;
  }

  /**
   * Determines if an error is retryable based on status code
   * @param {number} statusCode - HTTP status code
   * @returns {boolean} - Whether the error is retryable
   * @private
   */
  _isErrorRetryable(statusCode) {
    // 5xx errors and some 4xx errors are retryable
    return (
      statusCode >= 500 || // Server errors
      statusCode === 408 || // Request Timeout
      statusCode === 429    // Too Many Requests
    );
  }

  /**
   * Gets a user-friendly error message based on status code
   * @param {number} statusCode - HTTP status code
   * @param {Object} errorData - Error data from response
   * @returns {string} - User-friendly error message
   * @private
   */
  _getErrorMessage(statusCode, errorData) {
    // Use provided error message if available
    if (errorData && errorData.message) {
      return errorData.message;
    }
    
    // Default messages based on status code
    switch (statusCode) {
      case 400:
        return 'Invalid request. Please check your data and try again.';
      case 401:
        return 'Authentication required. Please log in and try again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 408:
        return 'The request timed out. Please try again.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error occurred. Please try again later.';
      case 503:
        return 'Service unavailable. Please try again later.';
      default:
        return `Error ${statusCode} occurred. Please try again.`;
    }
  }
}