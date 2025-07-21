/**
 * DateFilter Component
 * Handles filtering of todos by date range
 */
class DateFilter {
  /**
   * Create a DateFilter component
   * @param {Object} options - Configuration options
   * @param {string} options.containerId - ID of the container element
   * @param {Function} options.onFilter - Callback function when date filter changes
   */
  constructor(options = {}) {
    this.containerId = options.containerId || 'date-filter-container';
    this.onFilter = options.onFilter || (() => {});
    this.fromDate = null;
    this.toDate = null;
    
    this.render();
    this.setupEventListeners();
  }

  /**
   * Render the date filter HTML
   */
  render() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container with ID "${this.containerId}" not found`);
      return;
    }

    container.innerHTML = `
      <div class="date-filter mb-3">
        <div class="row g-2">
          <div class="col-md-5">
            <div class="input-group">
              <span class="input-group-text">From</span>
              <input 
                type="date" 
                class="form-control" 
                id="date-filter-from" 
                aria-label="From date"
              >
            </div>
            <div class="invalid-feedback" id="from-date-feedback"></div>
          </div>
          <div class="col-md-5">
            <div class="input-group">
              <span class="input-group-text">To</span>
              <input 
                type="date" 
                class="form-control" 
                id="date-filter-to" 
                aria-label="To date"
              >
            </div>
            <div class="invalid-feedback" id="to-date-feedback"></div>
          </div>
          <div class="col-md-2">
            <button 
              class="btn btn-outline-secondary w-100" 
              type="button" 
              id="clear-date-filter"
            >
              Clear
            </button>
          </div>
        </div>
        <div id="date-filter-error" class="alert alert-danger mt-2" style="display: none;">
          Invalid date range
        </div>
      </div>
    `;
  }

  /**
   * Set up event listeners for the date inputs
   */
  setupEventListeners() {
    const fromDateInput = document.getElementById('date-filter-from');
    const toDateInput = document.getElementById('date-filter-to');
    const clearButton = document.getElementById('clear-date-filter');
    
    if (!fromDateInput || !toDateInput || !clearButton) return;

    // Handle from date changes
    fromDateInput.addEventListener('change', () => {
      this.validateAndFilter();
    });

    // Handle to date changes
    toDateInput.addEventListener('change', () => {
      this.validateAndFilter();
    });

    // Handle clear button click
    clearButton.addEventListener('click', () => {
      this.reset();
      this.onFilter(null, null);
    });
    
    // Add keyup event for Enter key on date inputs
    fromDateInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        this.validateAndFilter();
      }
    });
    
    toDateInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        this.validateAndFilter();
      }
    });
  }

  /**
   * Validate date inputs and apply filter if valid
   */
  validateAndFilter() {
    const fromDateInput = document.getElementById('date-filter-from');
    const toDateInput = document.getElementById('date-filter-to');
    const fromDateFeedback = document.getElementById('from-date-feedback');
    const toDateFeedback = document.getElementById('to-date-feedback');
    const errorAlert = document.getElementById('date-filter-error');
    
    if (!fromDateInput || !toDateInput || !fromDateFeedback || !toDateFeedback || !errorAlert) {
      console.error('Date filter elements not found');
      return;
    }
    
    // Reset validation state
    fromDateInput.classList.remove('is-invalid');
    toDateInput.classList.remove('is-invalid');
    errorAlert.style.display = 'none';
    
    // Get date values
    const fromDateStr = fromDateInput.value.trim();
    const toDateStr = toDateInput.value.trim();
    
    // If both are empty, reset the filter
    if (!fromDateStr && !toDateStr) {
      this.fromDate = null;
      this.toDate = null;
      this.onFilter(null, null);
      return;
    }
    
    // Parse dates (will be empty strings if not set)
    let fromDate = null;
    let toDate = null;
    
    // Validate from date if provided
    if (fromDateStr) {
      fromDate = new Date(fromDateStr);
      fromDate.setHours(0, 0, 0, 0); // Set to beginning of day
      
      if (isNaN(fromDate.getTime())) {
        fromDateInput.classList.add('is-invalid');
        fromDateFeedback.textContent = 'Please enter a valid date';
        errorAlert.textContent = 'Invalid date format';
        errorAlert.style.display = 'block';
        return;
      }
    }
    
    // Validate to date if provided
    if (toDateStr) {
      toDate = new Date(toDateStr);
      toDate.setHours(23, 59, 59, 999); // Set to end of day
      
      if (isNaN(toDate.getTime())) {
        toDateInput.classList.add('is-invalid');
        toDateFeedback.textContent = 'Please enter a valid date';
        errorAlert.textContent = 'Invalid date format';
        errorAlert.style.display = 'block';
        return;
      }
    }
    
    // Validate date range if both dates are provided
    if (fromDate && toDate) {
      if (fromDate > toDate) {
        fromDateInput.classList.add('is-invalid');
        toDateInput.classList.add('is-invalid');
        fromDateFeedback.textContent = 'From date must be before To date';
        toDateFeedback.textContent = 'To date must be after From date';
        errorAlert.textContent = 'Invalid date range: "From" date must be before "To" date';
        errorAlert.style.display = 'block';
        return;
      }
    }
    
    // Validate against future dates (optional)
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (fromDate && fromDate > today) {
      fromDateInput.classList.add('is-invalid');
      fromDateFeedback.textContent = 'From date cannot be in the future';
      errorAlert.textContent = 'Invalid date: Cannot filter by future dates';
      errorAlert.style.display = 'block';
      return;
    }
    
    if (toDate && toDate > today) {
      // Just cap the to date at today rather than showing an error
      toDate = new Date(today);
      toDateInput.value = toDate.toISOString().split('T')[0];
    }
    
    // Store the validated dates
    this.fromDate = fromDate;
    this.toDate = toDate;
    
    // Apply the filter with valid dates
    this.onFilter(this.fromDate, this.toDate);
  }

  /**
   * Reset the date filter inputs
   */
  reset() {
    const fromDateInput = document.getElementById('date-filter-from');
    const toDateInput = document.getElementById('date-filter-to');
    const errorAlert = document.getElementById('date-filter-error');
    
    if (fromDateInput) {
      fromDateInput.value = '';
      fromDateInput.classList.remove('is-invalid');
    }
    
    if (toDateInput) {
      toDateInput.value = '';
      toDateInput.classList.remove('is-invalid');
    }
    
    if (errorAlert) {
      errorAlert.style.display = 'none';
    }
    
    this.fromDate = null;
    this.toDate = null;
  }

  /**
   * Get the current date filter values
   * @returns {Object} Object containing fromDate and toDate
   */
  getCurrentFilter() {
    return {
      fromDate: this.fromDate,
      toDate: this.toDate
    };
  }

  /**
   * Check if a date is within the current filter range
   * @param {Date} date - The date to check
   * @returns {boolean} True if the date is within range or no range is set
   */
  isDateInRange(date) {
    if (!date) return false;
    
    // If neither date is set, everything passes
    if (!this.fromDate && !this.toDate) return true;
    
    // Check against from date only
    if (this.fromDate && !this.toDate) {
      return date >= this.fromDate;
    }
    
    // Check against to date only
    if (!this.fromDate && this.toDate) {
      return date <= this.toDate;
    }
    
    // Check against both dates
    return date >= this.fromDate && date <= this.toDate;
  }
}

export default DateFilter;