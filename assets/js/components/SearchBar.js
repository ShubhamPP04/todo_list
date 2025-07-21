/**
 * SearchBar Component
 * Handles real-time filtering of todos by task name
 */
class SearchBar {
  /**
   * Create a SearchBar component
   * @param {Object} options - Configuration options
   * @param {string} options.containerId - ID of the container element
   * @param {Function} options.onSearch - Callback function when search criteria changes
   */
  constructor(options = {}) {
    this.containerId = options.containerId || 'search-container';
    this.onSearch = options.onSearch || (() => {});
    this.debounceTimeout = null;
    this.debounceDelay = 300; // ms
    
    this.render();
    this.setupEventListeners();
  }

  /**
   * Render the search bar HTML
   */
  render() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container with ID "${this.containerId}" not found`);
      return;
    }

    container.innerHTML = `
      <div class="search-bar mb-3">
        <div class="input-group">
          <span class="input-group-text">
            <i class="bi bi-search"></i>
          </span>
          <input 
            type="text" 
            class="form-control" 
            id="search-input" 
            placeholder="Search todos..." 
            aria-label="Search todos"
          >
          <button 
            class="btn btn-outline-secondary clear-search" 
            type="button" 
            id="clear-search-button"
            style="display: none;"
          >
            <i class="bi bi-x"></i>
          </button>
        </div>
        <div id="search-no-results" class="alert alert-info mt-2" style="display: none;">
          No todos match your search
        </div>
      </div>
    `;
  }

  /**
   * Set up event listeners for the search input
   */
  setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    const clearButton = document.getElementById('clear-search-button');
    
    if (!searchInput || !clearButton) return;

    // Handle input changes with debounce
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      
      // Show/hide clear button based on input content
      clearButton.style.display = query ? 'block' : 'none';
      
      // Debounce the search to avoid excessive filtering
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = setTimeout(() => {
        this.handleSearch(query);
      }, this.debounceDelay);
    });

    // Handle clear button click
    clearButton.addEventListener('click', () => {
      searchInput.value = '';
      clearButton.style.display = 'none';
      this.handleSearch('');
    });
  }

  /**
   * Handle search query changes
   * @param {string} query - The search query
   */
  handleSearch(query) {
    // Call the onSearch callback with the query
    this.onSearch(query);
  }

  /**
   * Update the no results message visibility
   * @param {boolean} show - Whether to show the no results message
   */
  showNoResults(show) {
    const noResultsElement = document.getElementById('search-no-results');
    if (noResultsElement) {
      noResultsElement.style.display = show ? 'block' : 'none';
    }
  }

  /**
   * Get the current search query
   * @returns {string} The current search query
   */
  getCurrentQuery() {
    const searchInput = document.getElementById('search-input');
    return searchInput ? searchInput.value.trim() : '';
  }

  /**
   * Reset the search input
   */
  reset() {
    const searchInput = document.getElementById('search-input');
    const clearButton = document.getElementById('clear-search-button');
    
    if (searchInput) searchInput.value = '';
    if (clearButton) clearButton.style.display = 'none';
    
    this.showNoResults(false);
  }
}

export default SearchBar;