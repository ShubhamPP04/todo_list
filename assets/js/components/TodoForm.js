/**
 * TodoForm Component
 * 
 * Responsible for handling the form to add new todos,
 * including validation, submission, and loading/error states.
 */
export default class TodoForm {
  /**
   * Creates a new TodoForm instance
   * @param {Object} options - Configuration options
   * @param {string} options.formId - ID of the form element
   * @param {string} options.inputId - ID of the todo input field
   * @param {string} options.completedId - ID of the completed checkbox
   * @param {string} options.submitButtonId - ID of the submit button
   * @param {Function} options.onSubmit - Callback when form is submitted
   */
  constructor(options = {}) {
    // Store DOM element references
    this.form = document.getElementById(options.formId || 'todoForm');
    this.input = document.getElementById(options.inputId || 'todoInput');
    this.completedCheckbox = document.getElementById(options.completedId || 'completedCheck');
    this.submitButton = document.getElementById(options.submitButtonId || 'submitTodo');
    this.spinner = this.submitButton ? this.submitButton.querySelector('.spinner-border') : null;
    
    // Store callback function
    this.onSubmit = options.onSubmit || (() => {});
    
    // Bind event handlers
    this._bindEvents();
  }

  /**
   * Binds event handlers to DOM elements
   * @private
   */
  _bindEvents() {
    if (this.form) {
      // Handle form submission
      this.form.addEventListener('submit', this._handleSubmit.bind(this));
      
      // Add input validation
      if (this.input) {
        this.input.addEventListener('input', () => {
          this._validateInput();
        });
        
        this.input.addEventListener('blur', () => {
          this._validateInput(true);
        });
      }
    }
  }

  /**
   * Handles form submission
   * @param {Event} event - Form submit event
   * @private
   */
  _handleSubmit(event) {
    event.preventDefault();
    
    // Validate form
    if (!this._validateForm()) {
      return;
    }
    
    // Show loading state
    this.setLoading(true);
    
    // Get form data
    const todoData = {
      title: this.input.value.trim(),
      completed: this.completedCheckbox ? this.completedCheckbox.checked : false
    };
    
    // Call the submit callback
    Promise.resolve(this.onSubmit(todoData))
      .then(() => {
        // Reset form on success
        this.resetForm();
      })
      .catch(error => {
        // Show error message
        this._showError(error);
      })
      .finally(() => {
        // Hide loading state
        this.setLoading(false);
      });
  }

  /**
   * Validates the entire form
   * @returns {boolean} - Whether the form is valid
   * @private
   */
  _validateForm() {
    let isValid = true;
    
    // Validate todo input
    if (!this._validateInput(true)) {
      isValid = false;
    }
    
    return isValid;
  }

  /**
   * Validates the todo input field
   * @param {boolean} showError - Whether to show error UI
   * @returns {boolean} - Whether the input is valid
   * @private
   */
  _validateInput(showError = false) {
    if (!this.input) return true;
    
    const value = this.input.value.trim();
    const isValid = value.length > 0;
    
    if (showError) {
      if (isValid) {
        this.input.classList.remove('is-invalid');
        this.input.classList.add('is-valid');
      } else {
        this.input.classList.remove('is-valid');
        this.input.classList.add('is-invalid');
      }
    }
    
    return isValid;
  }

  /**
   * Shows an error message for the form
   * @param {Error} error - Error object
   * @private
   */
  _showError(error) {
    // Create or update error alert
    let errorAlert = this.form.querySelector('.alert-danger');
    
    if (!errorAlert) {
      errorAlert = document.createElement('div');
      errorAlert.className = 'alert alert-danger mt-3';
      errorAlert.role = 'alert';
      this.form.appendChild(errorAlert);
    }
    
    // Set error message
    let errorMessage = 'Failed to add todo. Please try again.';
    
    if (error.standardized) {
      errorMessage = error.standardized.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    errorAlert.textContent = errorMessage;
    
    // Add dismiss button
    const dismissButton = document.createElement('button');
    dismissButton.type = 'button';
    dismissButton.className = 'btn-close';
    dismissButton.setAttribute('aria-label', 'Close');
    dismissButton.addEventListener('click', () => {
      errorAlert.remove();
    });
    
    errorAlert.appendChild(dismissButton);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      if (errorAlert.parentNode) {
        errorAlert.remove();
      }
    }, 5000);
  }

  /**
   * Sets the loading state of the form
   * @param {boolean} isLoading - Whether the form is loading
   */
  setLoading(isLoading) {
    if (this.submitButton) {
      this.submitButton.disabled = isLoading;
      
      if (this.spinner) {
        if (isLoading) {
          this.spinner.classList.remove('d-none');
        } else {
          this.spinner.classList.add('d-none');
        }
      }
    }
    
    // Disable form inputs during loading
    if (this.input) {
      this.input.disabled = isLoading;
    }
    
    if (this.completedCheckbox) {
      this.completedCheckbox.disabled = isLoading;
    }
  }

  /**
   * Resets the form to its initial state
   */
  resetForm() {
    if (this.form) {
      this.form.reset();
      
      // Remove validation classes
      if (this.input) {
        this.input.classList.remove('is-valid', 'is-invalid');
      }
      
      // Remove any error messages
      const errorAlert = this.form.querySelector('.alert-danger');
      if (errorAlert) {
        errorAlert.remove();
      }
    }
  }
}