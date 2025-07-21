/**
 * ErrorHandler Component
 * 
 * Responsible for displaying error messages and providing retry mechanisms
 * for failed operations. Supports different error types and prioritization.
 */
export default class ErrorHandler {
  /**
   * Creates a new ErrorHandler instance
   * @param {Object} options - Configuration options
   * @param {string} options.containerId - ID of the container to append errors to
   * @param {number} options.autoDismissTimeout - Time in ms before auto-dismissing errors (0 to disable)
   * @param {number} options.maxErrors - Maximum number of errors to show at once
   */
  constructor(options = {}) {
    // Store options with defaults
    this.containerId = options.containerId || 'errorContainer';
    this.autoDismissTimeout = options.autoDismissTimeout !== undefined ? options.autoDismissTimeout : 5000;
    this.maxErrors = options.maxErrors || 3;
    
    // Create container if it doesn't exist
    this._ensureContainer();
    
    // Track active errors
    this.activeErrors = [];
    
    // Error priority levels (higher number = higher priority)
    this.errorPriorities = {
      'OFFLINE': 5,      // Network offline
      'TIMEOUT': 4,      // Request timeout
      'AUTH': 4,         // Authentication errors
      'VALIDATION': 3,   // Input validation errors
      'API': 2,          // General API errors
      'SUCCESS': 2,      // Success messages
      'NETWORK': 2,      // Network status messages
      'UNKNOWN': 1       // Unknown errors
    };
  }

  /**
   * Ensures the error container exists in the DOM
   * @private
   */
  _ensureContainer() {
    this.container = document.getElementById(this.containerId);
    
    if (!this.container) {
      // Create container if it doesn't exist
      this.container = document.createElement('div');
      this.container.id = this.containerId;
      this.container.className = 'error-container position-fixed top-0 end-0 p-3';
      this.container.style.zIndex = '1050';
      this.container.style.maxWidth = '350px';
      document.body.appendChild(this.container);
      
      // Add some basic styling for the container
      this.container.style.display = 'flex';
      this.container.style.flexDirection = 'column';
      this.container.style.gap = '10px';
      this.container.style.pointerEvents = 'none'; // Let clicks pass through container
      
      // Add style for toast elements to have pointer events
      const style = document.createElement('style');
      style.textContent = `
        #${this.containerId} .toast {
          pointer-events: auto;
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Shows an error message
   * @param {Object} options - Error options
   * @param {string} options.message - Error message to display
   * @param {string} options.type - Error type for prioritization
   * @param {boolean} options.retryable - Whether the error can be retried
   * @param {Function} options.onRetry - Callback when retry is clicked
   * @param {string} options.level - Error level (danger, warning, info)
   * @returns {string} - ID of the created error
   */
  showError(options = {}) {
    // Extract options with defaults
    const message = options.message || 'An error occurred';
    const type = options.type || 'UNKNOWN';
    const retryable = options.retryable !== undefined ? options.retryable : false;
    const onRetry = options.onRetry || (() => {});
    const level = options.level || 'danger';
    
    // Generate unique ID for this error
    const errorId = `error-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create error object
    const errorObj = {
      id: errorId,
      message,
      type,
      retryable,
      onRetry,
      level,
      priority: this.errorPriorities[type] || 1,
      timestamp: Date.now()
    };
    
    // Add to active errors
    this.activeErrors.push(errorObj);
    
    // Sort by priority (highest first)
    this.activeErrors.sort((a, b) => b.priority - a.priority);
    
    // Limit to max errors
    if (this.activeErrors.length > this.maxErrors) {
      // Remove lowest priority errors
      const removedErrors = this.activeErrors.splice(this.maxErrors);
      
      // Remove their DOM elements
      removedErrors.forEach(error => {
        const element = document.getElementById(error.id);
        if (element) {
          element.remove();
        }
      });
    }
    
    // Create and show the error element
    this._createErrorElement(errorObj);
    
    // Return the error ID for potential later reference
    return errorId;
  }

  /**
   * Creates and appends an error element to the container
   * @param {Object} errorObj - Error object
   * @private
   */
  _createErrorElement(errorObj) {
    // Create toast container
    const toast = document.createElement('div');
    toast.id = errorObj.id;
    toast.className = `toast show mb-3 bg-${errorObj.level} text-white`;
    toast.role = 'alert';
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    // Create toast header
    const header = document.createElement('div');
    header.className = 'toast-header bg-transparent text-white border-0';
    
    // Add icon based on error type
    const icon = document.createElement('i');
    icon.className = this._getIconClass(errorObj.type);
    icon.style.marginRight = '0.5rem';
    
    // Add title
    const title = document.createElement('strong');
    title.className = 'me-auto';
    title.textContent = this._getErrorTitle(errorObj.type);
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'btn-close btn-close-white';
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.addEventListener('click', () => {
      this.dismissError(errorObj.id);
    });
    
    // Assemble header
    header.appendChild(icon);
    header.appendChild(title);
    header.appendChild(closeButton);
    
    // Create toast body
    const body = document.createElement('div');
    body.className = 'toast-body';
    body.textContent = errorObj.message;
    
    // Add retry button if retryable
    if (errorObj.retryable) {
      const retryButton = document.createElement('button');
      retryButton.type = 'button';
      retryButton.className = 'btn btn-sm btn-outline-light mt-2';
      retryButton.textContent = 'Retry';
      retryButton.addEventListener('click', () => {
        // Call retry callback
        errorObj.onRetry();
        
        // Dismiss the error
        this.dismissError(errorObj.id);
      });
      
      body.appendChild(document.createElement('br'));
      body.appendChild(retryButton);
    }
    
    // Assemble toast
    toast.appendChild(header);
    toast.appendChild(body);
    
    // Add to container
    this.container.appendChild(toast);
    
    // Set up auto-dismiss if enabled
    if (this.autoDismissTimeout > 0) {
      setTimeout(() => {
        this.dismissError(errorObj.id);
      }, this.autoDismissTimeout);
    }
  }

  /**
   * Gets the appropriate icon class for an error type
   * @param {string} type - Error type
   * @returns {string} - Bootstrap icon class
   * @private
   */
  _getIconClass(type) {
    switch (type) {
      case 'OFFLINE':
        return 'bi bi-wifi-off';
      case 'TIMEOUT':
        return 'bi bi-clock-history';
      case 'AUTH':
        return 'bi bi-shield-lock';
      case 'VALIDATION':
        return 'bi bi-exclamation-triangle';
      case 'API':
        return 'bi bi-cloud-slash';
      case 'SUCCESS':
        return 'bi bi-check-circle';
      case 'NETWORK':
        return 'bi bi-wifi';
      default:
        return 'bi bi-exclamation-circle';
    }
  }

  /**
   * Gets a user-friendly title for an error type
   * @param {string} type - Error type
   * @returns {string} - Error title
   * @private
   */
  _getErrorTitle(type) {
    switch (type) {
      case 'OFFLINE':
        return 'Connection Error';
      case 'TIMEOUT':
        return 'Request Timeout';
      case 'AUTH':
        return 'Authentication Error';
      case 'VALIDATION':
        return 'Validation Error';
      case 'API':
        return 'API Error';
      case 'SUCCESS':
        return 'Success';
      case 'NETWORK':
        return 'Network Status';
      default:
        return 'Error';
    }
  }

  /**
   * Dismisses an error by ID
   * @param {string} errorId - ID of the error to dismiss
   */
  dismissError(errorId) {
    // Find the error in active errors
    const index = this.activeErrors.findIndex(error => error.id === errorId);
    
    if (index !== -1) {
      // Remove from active errors
      this.activeErrors.splice(index, 1);
    }
    
    // Remove from DOM
    const element = document.getElementById(errorId);
    if (element) {
      // Add fade-out animation
      element.classList.add('fade');
      
      // Remove after animation
      setTimeout(() => {
        if (element.parentNode) {
          element.remove();
        }
      }, 150);
    }
  }

  /**
   * Dismisses all active errors
   */
  dismissAll() {
    // Copy the array to avoid modification during iteration
    const errors = [...this.activeErrors];
    
    // Dismiss each error
    errors.forEach(error => {
      this.dismissError(error.id);
    });
    
    // Clear active errors
    this.activeErrors = [];
  }

  /**
   * Handles an error from an API call or other source
   * @param {Error} error - Error object
   * @param {Function} retryCallback - Function to call when retry is clicked
   * @returns {string} - ID of the created error
   */
  handleError(error, retryCallback = null) {
    // Default error options
    const options = {
      message: 'An unexpected error occurred',
      type: 'UNKNOWN',
      retryable: !!retryCallback,
      onRetry: retryCallback,
      level: 'danger'
    };
    
    // Extract standardized error info if available
    if (error.standardized) {
      options.message = error.standardized.message;
      options.retryable = error.standardized.retryable && !!retryCallback;
    } else if (error.message) {
      options.message = error.message;
    }
    
    // Determine error type
    if (error.type === 'OFFLINE') {
      options.type = 'OFFLINE';
    } else if (error.type === 'TIMEOUT') {
      options.type = 'TIMEOUT';
    } else if (error.status === 401 || error.status === 403) {
      options.type = 'AUTH';
    } else if (error.status === 400 || error.status === 422) {
      options.type = 'VALIDATION';
    } else if (error.status) {
      options.type = 'API';
    }
    
    // Show the error
    return this.showError(options);
  }
}