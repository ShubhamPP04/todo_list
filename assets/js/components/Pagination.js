/**
 * Pagination Component
 * Handles client-side pagination for todo items
 * 
 * Implements requirements:
 * - 5.1: Implement client-side pagination when there are more than 10 todos
 * - 5.2: Show page numbers and navigation controls
 * - 5.3: Display corresponding set of todos when page number is clicked
 * - 5.4: Navigate to adjacent pages with next/previous buttons
 * - 5.6: Disable "Next" button on last page
 * - 5.7: Disable "Previous" button on first page
 */
class Pagination {
  /**
   * Create a Pagination component
   * @param {Object} options - Configuration options
   * @param {string} options.containerId - ID of the container element
   * @param {number} options.itemsPerPage - Number of items to display per page
   * @param {number} options.totalItems - Total number of items
   * @param {Function} options.onPageChange - Callback function when page changes
   * @param {number} options.maxVisiblePages - Maximum number of page buttons to show
   */
  constructor(options = {}) {
    this.containerId = options.containerId || 'pagination-container';
    this.itemsPerPage = options.itemsPerPage || 10;
    this.totalItems = options.totalItems || 0;
    this.currentPage = 1;
    this.previousPage = 1;
    this.onPageChange = options.onPageChange || (() => {});
    this.maxVisiblePages = options.maxVisiblePages || 5;
    
    this.render();
  }

  /**
   * Calculate the total number of pages
   * @returns {number} Total number of pages
   */
  get totalPages() {
    return Math.max(1, Math.ceil(this.totalItems / this.itemsPerPage));
  }

  /**
   * Render the pagination controls
   */
  render() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container with ID "${this.containerId}" not found`);
      return;
    }

    // Don't show pagination if there's only one page
    if (this.totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    // Create pagination HTML
    let paginationHtml = `
      <nav aria-label="Todo list pagination">
        <ul class="pagination justify-content-center">
          <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
            <button class="page-link" data-page="prev" aria-label="Previous">
              <span aria-hidden="true">&laquo;</span>
            </button>
          </li>
    `;

    // Generate page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page link if not in range
    if (startPage > 1) {
      paginationHtml += `
        <li class="page-item">
          <button class="page-link" data-page="1">1</button>
        </li>
      `;
      
      if (startPage > 2) {
        paginationHtml += `
          <li class="page-item disabled">
            <span class="page-link">...</span>
          </li>
        `;
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      paginationHtml += `
        <li class="page-item ${i === this.currentPage ? 'active' : ''}">
          <button class="page-link" data-page="${i}">${i}</button>
        </li>
      `;
    }

    // Last page link if not in range
    if (endPage < this.totalPages) {
      if (endPage < this.totalPages - 1) {
        paginationHtml += `
          <li class="page-item disabled">
            <span class="page-link">...</span>
          </li>
        `;
      }
      
      paginationHtml += `
        <li class="page-item">
          <button class="page-link" data-page="${this.totalPages}">${this.totalPages}</button>
        </li>
      `;
    }

    // Next button
    paginationHtml += `
          <li class="page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}">
            <button class="page-link" data-page="next" aria-label="Next">
              <span aria-hidden="true">&raquo;</span>
            </button>
          </li>
        </ul>
      </nav>
    `;

    container.innerHTML = paginationHtml;
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for pagination controls
   */
  setupEventListeners() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    // Add click event listeners to all page links
    const pageLinks = container.querySelectorAll('.page-link');
    pageLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const pageValue = e.currentTarget.getAttribute('data-page');
        
        // Handle special cases (prev/next)
        if (pageValue === 'prev' && this.currentPage > 1) {
          this.goToPage(this.currentPage - 1);
        } else if (pageValue === 'next' && this.currentPage < this.totalPages) {
          this.goToPage(this.currentPage + 1);
        } else if (pageValue !== 'prev' && pageValue !== 'next') {
          // Handle numeric page
          this.goToPage(parseInt(pageValue, 10));
        }
      });
    });
  }

  /**
   * Navigate to a specific page
   * @param {number} pageNumber - The page number to navigate to
   */
  goToPage(pageNumber) {
    if (pageNumber < 1 || pageNumber > this.totalPages || pageNumber === this.currentPage) {
      return;
    }

    this.previousPage = this.currentPage;
    this.currentPage = pageNumber;
    this.render();
    this.onPageChange(this.currentPage);
  }

  /**
   * Update the total number of items and re-render
   * @param {number} totalItems - New total number of items
   * @param {boolean} resetPage - Whether to reset to page 1
   */
  updateTotalItems(totalItems, resetPage = false) {
    const previousTotalPages = this.totalPages;
    this.totalItems = totalItems;
    
    // Store previous page before any adjustments
    const wasOnPage = this.currentPage;
    
    // If current page is now out of bounds, adjust it
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
    
    // Reset to page 1 if requested (typically when filters change)
    if (resetPage) {
      this.previousPage = this.currentPage; // Store current page before resetting
      this.currentPage = 1;
    }
    
    // Re-render the pagination controls
    this.render();
    
    // Determine if we need to notify about page change
    const pageChanged = resetPage || this.currentPage !== wasOnPage;
    const totalPagesChanged = previousTotalPages !== this.totalPages;
    
    // If the page changed due to adjustments or total pages changed, notify via callback
    if (pageChanged || totalPagesChanged) {
      this.onPageChange(this.currentPage);
    }
  }

  /**
   * Get the current page number
   * @returns {number} Current page number
   */
  getCurrentPage() {
    return this.currentPage;
  }

  /**
   * Get the current pagination state
   * @returns {Object} Object with pagination state
   */
  getPaginationState() {
    return {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage,
      totalItems: this.totalItems,
      totalPages: this.totalPages
    };
  }

  /**
   * Reset pagination to first page
   */
  reset() {
    this.currentPage = 1;
    this.render();
  }
}

export default Pagination;