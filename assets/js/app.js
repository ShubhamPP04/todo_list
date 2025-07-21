/**
 * Todo List Application - Main Entry Point
 * 
 * This file serves as the main entry point for the Todo List application.
 * It initializes all components and sets up event listeners.
 */

// Import configuration and services
import { config } from './config.js';
import TodoService from './services/TodoService.js';

// Import components
import TodoList from './components/TodoList.js';
import TodoForm from './components/TodoForm.js';
import ErrorHandler from './components/ErrorHandler.js';
import SearchBar from './components/SearchBar.js';
import DateFilter from './components/DateFilter.js';
import Pagination from './components/Pagination.js';

/**
 * TodoApp - Main application class that manages all components and application state
 */
class TodoApp {
  /**
   * Initialize the Todo application
   */
  constructor() {
    console.log('Todo List Application initialized');
    console.log(`API Base URL: ${config.apiBaseUrl}`);
    
    // Initialize application state
    this.state = {
      allTodos: [],          // Store all fetched todos
      filteredTodos: [],     // Store filtered todos
      currentSearchQuery: '', // Current search query
      currentFromDate: null, // Current from date filter
      currentToDate: null,   // Current to date filter
      currentStatusFilter: 'all', // Current status filter (all, active, completed)
      totalItemsCount: 0,    // Total items count from API
      isLoading: false,      // Loading state flag
      currentPage: 1         // Current page number
    };
    
    // Initialize services
    this.todoService = new TodoService();
  
    // Initialize components
    this.initializeComponents();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Update responsive layout for initial screen size
    this.updateResponsiveLayout();
    
    // Add a small delay to ensure DOM is fully ready
    setTimeout(() => {
      this.updateResponsiveLayout();
    }, 100);
    
    // Load initial data
    this.loadTodos();
  }
  
  /**
   * Initialize all UI components
   */
  initializeComponents() {
    // Initialize error handler first
    this.errorHandler = new ErrorHandler({
      containerId: 'errorContainer',
      autoDismissTimeout: 5000,
      maxErrors: 3
    });
    
    // Add global error handler for uncaught errors
    window.addEventListener('error', (event) => {
      console.error('Global error caught:', event.error);
      this.errorHandler.showError({
        message: 'An unexpected error occurred. Please refresh the page if problems persist.',
        type: 'UNKNOWN',
        level: 'danger',
        retryable: false
      });
    });
    
    // Add handler for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.errorHandler.showError({
        message: 'An unexpected error occurred. Please try again.',
        type: 'UNKNOWN',
        level: 'warning',
        retryable: true,
        onRetry: () => {
          this.loadTodos();
        }
      });
    });
    
    // Initialize TodoList component
    this.todoList = new TodoList({
      containerId: 'todoList',
      loadingStateId: 'loadingState',
      emptyStateId: 'emptyState',
      errorStateId: 'errorState',
      onTodoToggle: (todoId, completed) => {
        console.log(`Todo ${todoId} toggled: ${completed}`);
        // TODO: Implement toggle functionality when we add that feature
      }
    });
    
    // Initialize TodoForm component
    this.todoForm = new TodoForm({
      formId: 'todoForm',
      inputId: 'todoInput',
      completedId: 'completedCheck',
      submitButtonId: 'submitTodo',
      onSubmit: async (todoData) => {
        try {
          // Add the new todo via API
          const newTodo = await this.todoService.addTodo(todoData);
          
          // Show success message
          this.errorHandler.showError({
            message: 'Todo added successfully!',
            type: 'SUCCESS',
            level: 'success',
            retryable: false
          });
          
          // Add the new todo to the current list without reloading
          this._addTodoToCurrentList(newTodo);
          
          // Return success
          return newTodo;
        } catch (error) {
          console.error('Failed to add todo:', error);
          
          // Show error using ErrorHandler
          this.errorHandler.handleError(error, () => {
            // Retry callback
            this.todoForm.setLoading(true);
            this.todoService.addTodo(todoData)
              .then((newTodo) => {
                // Show success message on retry
                this.errorHandler.showError({
                  message: 'Todo added successfully on retry!',
                  type: 'SUCCESS',
                  level: 'success',
                  retryable: false
                });
                
                // Add the new todo to the current list without reloading
                this._addTodoToCurrentList(newTodo);
                this.todoForm.resetForm();
              })
              .catch(retryError => {
                this.errorHandler.handleError(retryError);
              })
              .finally(() => {
                this.todoForm.setLoading(false);
              });
          });
          
          throw error;
        }
      }
    });
    
    // Initialize Pagination component
    this.pagination = new Pagination({
      containerId: 'pagination-container',
      itemsPerPage: config.pagination.itemsPerPage,
      totalItems: 0,
      onPageChange: (pageNumber) => {
        // When page changes, we need to display the correct subset of filtered todos
        this.state.currentPage = pageNumber;
        this.displayCurrentPageTodos(pageNumber);
      }
    });
    
    // Initialize SearchBar component
    this.searchBar = new SearchBar({
      containerId: 'search-container',
      onSearch: (query) => {
        // Only apply filters if the query actually changed
        if (this.state.currentSearchQuery !== query) {
          this.state.currentSearchQuery = query;
          this.applyFilters(true); // Reset to first page when search changes
        }
      }
    });
    
    // Initialize DateFilter component
    this.dateFilter = new DateFilter({
      containerId: 'date-filter-container',
      onFilter: (fromDate, toDate) => {
        // Check if date filters actually changed
        const fromChanged = (this.state.currentFromDate === null && fromDate !== null) || 
                           (this.state.currentFromDate !== null && fromDate === null) ||
                           (this.state.currentFromDate && fromDate && 
                            this.state.currentFromDate.getTime() !== fromDate.getTime());
        
        const toChanged = (this.state.currentToDate === null && toDate !== null) || 
                         (this.state.currentToDate !== null && toDate === null) ||
                         (this.state.currentToDate && toDate && 
                          this.state.currentToDate.getTime() !== toDate.getTime());
        
        if (fromChanged || toChanged) {
          this.state.currentFromDate = fromDate;
          this.state.currentToDate = toDate;
          this.applyFilters(true); // Reset to first page when date filter changes
        }
      }
    });
  }
  
  /**
   * Set up global event listeners
   */
  setupEventListeners() {
    // Listen for retry events
    document.addEventListener('todo-list:retry', () => {
      this.loadTodos();
    });
    
    // Listen for window resize events to adjust responsive layout
    window.addEventListener('resize', this.debounce(() => {
      this.updateResponsiveLayout();
    }, 250));
    
    // Custom event for filter changes
    document.addEventListener('todo-filter:change', () => {
      this.applyFilters(true);
    });
    
    // Custom event for todo added
    document.addEventListener('todo:added', () => {
      this.loadTodos();
    });
    
    // Listen for network status changes
    window.addEventListener('online', () => {
      console.log('Connection restored. Reloading data...');
      // Show a notification
      this.errorHandler.showError({
        message: 'Internet connection restored. Reloading data...',
        type: 'NETWORK',
        level: 'success',
        retryable: false
      });
      // Reload todos after a short delay
      setTimeout(() => {
        this.loadTodos();
      }, 1500);
    });
    
    window.addEventListener('offline', () => {
      console.log('Connection lost.');
      // Show a notification
      this.errorHandler.showError({
        message: 'Internet connection lost. Some features may not work properly.',
        type: 'OFFLINE',
        level: 'warning',
        retryable: false
      });
    });
    
    // Custom event from ApiService when connection is restored
    document.addEventListener('network:online', () => {
      this.errorHandler.showError({
        message: 'Internet connection restored. You can retry your previous action.',
        type: 'NETWORK',
        level: 'success',
        retryable: true,
        onRetry: () => {
          this.loadTodos();
        }
      });
    });
    
    // Mobile action bar event listeners
    const mobileFilterBtn = document.getElementById('mobile-filter');
    const mobileSearchBtn = document.getElementById('mobile-search');
    const mobileAddBtn = document.getElementById('mobile-add');
    
    if (mobileFilterBtn) {
      mobileFilterBtn.addEventListener('click', () => {
        const dateFilterContainer = document.getElementById('date-filter-container');
        if (dateFilterContainer) {
          dateFilterContainer.scrollIntoView({ behavior: 'smooth' });
          // Add a highlight effect
          dateFilterContainer.classList.add('pulse');
          setTimeout(() => {
            dateFilterContainer.classList.remove('pulse');
          }, 1000);
        }
      });
    }
    
    if (mobileSearchBtn) {
      mobileSearchBtn.addEventListener('click', () => {
        const searchContainer = document.getElementById('search-container');
        if (searchContainer) {
          searchContainer.scrollIntoView({ behavior: 'smooth' });
          // Focus on the search input
          const searchInput = document.getElementById('search-input');
          if (searchInput) {
            searchInput.focus();
          }
          // Add a highlight effect
          searchContainer.classList.add('pulse');
          setTimeout(() => {
            searchContainer.classList.remove('pulse');
          }, 1000);
        }
      });
    }
    
    if (mobileAddBtn) {
      mobileAddBtn.addEventListener('click', () => {
        const todoForm = document.getElementById('todoForm');
        if (todoForm) {
          todoForm.scrollIntoView({ behavior: 'smooth' });
          // Focus on the todo input
          const todoInput = document.getElementById('todoInput');
          if (todoInput) {
            todoInput.focus();
          }
          // Add a highlight effect
          todoForm.closest('.card').classList.add('pulse');
          setTimeout(() => {
            todoForm.closest('.card').classList.remove('pulse');
          }, 1000);
        }
      });
    }
    
    // View options dropdown event listeners
    const viewAllBtn = document.getElementById('view-all');
    const viewActiveBtn = document.getElementById('view-active');
    const viewCompletedBtn = document.getElementById('view-completed');
    const refreshTodosBtn = document.getElementById('refresh-todos');
    
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', () => {
        this.state.currentStatusFilter = 'all';
        this.applyFilters(true);
      });
    }
    
    if (viewActiveBtn) {
      viewActiveBtn.addEventListener('click', () => {
        this.state.currentStatusFilter = 'active';
        this.applyFilters(true);
      });
    }
    
    if (viewCompletedBtn) {
      viewCompletedBtn.addEventListener('click', () => {
        this.state.currentStatusFilter = 'completed';
        this.applyFilters(true);
      });
    }
    
    if (refreshTodosBtn) {
      refreshTodosBtn.addEventListener('click', () => {
        this.loadTodos();
      });
    }
  }
  
  /**
   * Loads todos from the API and updates the UI
   * @param {number} page - Page number to load (defaults to 1)
   */
  async loadTodos(page = 1) {
    try {
      // Update loading state
      this.state.isLoading = true;
      this.todoList.showLoading();
      
      // Fetch todos from API
      const result = await this.todoService.fetchTodos({
        page: page,
        limit: config.pagination.itemsPerPage
      });
      
      // Store all todos and total count in application state
      this.state.allTodos = result.todos;
      this.state.totalItemsCount = result.pagination.total;
      
      // Update pagination with total count from API
      this.pagination.updateTotalItems(this.state.totalItemsCount, false);
      
      // Apply any existing filters
      this.applyFilters(false); // Don't reset page when loading initial data
      
      // Update loading state
      this.state.isLoading = false;
      
    } catch (error) {
      console.error('Failed to load todos:', error);
      
      // Show error using ErrorHandler
      this.errorHandler.handleError(error, () => {
        // Retry callback
        this.loadTodos(this.pagination.getCurrentPage());
      });
      
      // Also show error in the todo list UI
      let errorMessage = 'Unable to load todos. Please try again later.';
      
      if (error.standardized) {
        errorMessage = error.standardized.message;
      }
      
      this.todoList.showError(errorMessage);
      this.state.isLoading = false;
    }
  }
  
  /**
   * Applies all active filters (search, date, status) to the todos
   * @param {boolean} resetPage - Whether to reset to first page after filtering
   */
  applyFilters(resetPage = false) {
    // Start with all todos
    this.state.filteredTodos = [...this.state.allTodos];
    
    // Apply search filter if there's a query
    if (this.state.currentSearchQuery) {
      const query = this.state.currentSearchQuery.toLowerCase();
      this.state.filteredTodos = this.state.filteredTodos.filter(todo => {
        // Handle both 'title' and 'todo' field names for cross-API compatibility
        const todoText = todo.title || todo.todo || '';
        return todoText.toLowerCase().includes(query);
      });
    }
    
    // Apply date filters if set
    if (this.state.currentFromDate || this.state.currentToDate) {
      this.state.filteredTodos = this.state.filteredTodos.filter(todo => {
        if (!todo.createdAt) return false;
        
        const todoDate = new Date(todo.createdAt);
        
        // Check against from date only
        if (this.state.currentFromDate && !this.state.currentToDate) {
          return todoDate >= this.state.currentFromDate;
        }
        
        // Check against to date only
        if (!this.state.currentFromDate && this.state.currentToDate) {
          return todoDate <= this.state.currentToDate;
        }
        
        // Check against both dates
        if (this.state.currentFromDate && this.state.currentToDate) {
          return todoDate >= this.state.currentFromDate && todoDate <= this.state.currentToDate;
        }
        
        return true;
      });
    }
    
    // Apply status filter if not set to 'all'
    if (this.state.currentStatusFilter !== 'all') {
      this.state.filteredTodos = this.state.filteredTodos.filter(todo => {
        if (this.state.currentStatusFilter === 'active') {
          return !todo.completed;
        } else if (this.state.currentStatusFilter === 'completed') {
          return todo.completed;
        }
        return true;
      });
    }
    
    // Update pagination with filtered count and reset to first page if needed
    this.pagination.updateTotalItems(this.state.filteredTodos.length, resetPage);
    
    // Display the current page of filtered todos
    this.displayCurrentPageTodos(resetPage ? 1 : this.pagination.getCurrentPage());
    
    // Update UI to reflect filter state
    this.updateFilterUI();
  }
  
  /**
   * Displays the current page of filtered todos
   * @param {number} pageNumber - The page number to display
   */
  displayCurrentPageTodos(pageNumber) {
    const itemsPerPage = config.pagination.itemsPerPage;
    
    // Handle empty filtered todos
    if (this.state.filteredTodos.length === 0) {
      this.updateTodoListUI([]);
      return;
    }
    
    // Calculate total pages
    const totalPages = Math.max(1, Math.ceil(this.state.filteredTodos.length / itemsPerPage));
    
    // Ensure page number is valid
    const validPageNumber = Math.max(1, Math.min(pageNumber, totalPages));
    
    const startIndex = (validPageNumber - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    // Get the subset of todos for the current page
    const currentPageTodos = this.state.filteredTodos.slice(startIndex, endIndex);
    
    // Update UI based on filtered results
    this.updateTodoListUI(currentPageTodos);
    
    // If the page number was adjusted, update the pagination component
    if (validPageNumber !== pageNumber) {
      this.pagination.goToPage(validPageNumber);
    }
    
    // Update the current page in state
    this.state.currentPage = validPageNumber;
    
    // Update the todo count badge
    const todoCountElement = document.getElementById('todo-count');
    if (todoCountElement) {
      todoCountElement.textContent = this.state.filteredTodos.length;
    }
  }
  
  /**
   * Updates the TodoList UI based on filtered results
   * @param {Array} todosToDisplay - The todos to display on the current page
   */
  updateTodoListUI(todosToDisplay) {
    // Show no results message in SearchBar if needed
    if ((this.state.currentSearchQuery || this.state.currentFromDate || this.state.currentToDate) && 
        this.state.filteredTodos.length === 0) {
      this.searchBar.showNoResults(true);
    } else {
      this.searchBar.showNoResults(false);
    }
    
    // Render the todos for the current page
    this.todoList.render(todosToDisplay);
    
    // If no todos after filtering, show empty state
    if (todosToDisplay.length === 0) {
      // Don't show empty state if it's due to filtering
      if (!this.state.currentSearchQuery && 
          !this.state.currentFromDate && 
          !this.state.currentToDate && 
          this.state.currentStatusFilter === 'all') {
        this.todoList.showEmpty();
      } else {
        // Show a custom message for filtered results with no matches
        let customMessage = 'No todos match your current filters.';
        
        // Make the message more specific based on active filters
        if (this.state.currentStatusFilter === 'active') {
          customMessage = 'No active todos found.';
        } else if (this.state.currentStatusFilter === 'completed') {
          customMessage = 'No completed todos found.';
        } else if (this.state.currentSearchQuery) {
          customMessage = `No todos found matching "${this.state.currentSearchQuery}".`;
        }
        
        this.todoList.showCustomEmpty(customMessage);
      }
    }
  }
  
  /**
   * Updates UI elements based on current filter state
   * Shows/hides pagination based on filtered results
   */
  updateFilterUI() {
    const paginationContainer = document.getElementById('pagination-container');
    
    // Show pagination only if we have more than one page of filtered results
    if (paginationContainer) {
      const paginationState = this.pagination.getPaginationState();
      const hasMultiplePages = paginationState.totalPages > 1;
      
      // Toggle pagination visibility
      paginationContainer.style.display = hasMultiplePages ? 'block' : 'none';
    }
    
    // Update view options dropdown to reflect current status filter
    const viewAllBtn = document.getElementById('view-all');
    const viewActiveBtn = document.getElementById('view-active');
    const viewCompletedBtn = document.getElementById('view-completed');
    const todoViewOptions = document.getElementById('todoViewOptions');
    
    if (viewAllBtn && viewActiveBtn && viewCompletedBtn && todoViewOptions) {
      // Remove active class from all buttons
      viewAllBtn.classList.remove('active');
      viewActiveBtn.classList.remove('active');
      viewCompletedBtn.classList.remove('active');
      
      // Add active class to the current filter button
      if (this.state.currentStatusFilter === 'all') {
        viewAllBtn.classList.add('active');
        todoViewOptions.innerHTML = '<i class="bi bi-gear"></i> All';
        todoViewOptions.classList.remove('filtered');
      } else if (this.state.currentStatusFilter === 'active') {
        viewActiveBtn.classList.add('active');
        todoViewOptions.innerHTML = '<i class="bi bi-gear"></i> Active';
        todoViewOptions.classList.add('filtered');
      } else if (this.state.currentStatusFilter === 'completed') {
        viewCompletedBtn.classList.add('active');
        todoViewOptions.innerHTML = '<i class="bi bi-gear"></i> Completed';
        todoViewOptions.classList.add('filtered');
      }
    }
    
    // Update filter status indicators if they exist
    const filterStatusElement = document.getElementById('filter-status');
    if (filterStatusElement) {
      const totalResults = this.state.filteredTodos.length;
      const totalOriginal = this.state.allTodos.length;
      
      // Check if any filters are active (including status filter)
      const hasActiveFilters = this.state.currentSearchQuery || 
                              this.state.currentFromDate || 
                              this.state.currentToDate ||
                              this.state.currentStatusFilter !== 'all';
      
      if (hasActiveFilters) {
        // Create a more descriptive filter status message
        let statusMessage = `Showing ${totalResults} of ${totalOriginal} todos`;
        
        // Add details about which filters are active
        const activeFilters = [];
        
        if (this.state.currentSearchQuery) {
          activeFilters.push(`search: "${this.state.currentSearchQuery}"`);
        }
        
        if (this.state.currentFromDate && this.state.currentToDate) {
          const fromDate = this.state.currentFromDate.toLocaleDateString();
          const toDate = this.state.currentToDate.toLocaleDateString();
          activeFilters.push(`date range: ${fromDate} to ${toDate}`);
        } else if (this.state.currentFromDate) {
          const fromDate = this.state.currentFromDate.toLocaleDateString();
          activeFilters.push(`from date: ${fromDate}`);
        } else if (this.state.currentToDate) {
          const toDate = this.state.currentToDate.toLocaleDateString();
          activeFilters.push(`to date: ${toDate}`);
        }
        
        // Add status filter if not 'all'
        if (this.state.currentStatusFilter !== 'all') {
          activeFilters.push(`status: ${this.state.currentStatusFilter}`);
        }
        
        if (activeFilters.length > 0) {
          statusMessage += ` (${activeFilters.join(', ')})`;
        }
        
        // Create filter status with clear button
        filterStatusElement.innerHTML = `
          <div class="d-flex justify-content-between align-items-center">
            <span>${statusMessage}</span>
            <button id="clear-all-filters" class="btn btn-sm btn-outline-info">
              <i class="bi bi-x-circle"></i> Clear All Filters
            </button>
          </div>
        `;
        
        // Add event listener to clear button
        const clearButton = document.getElementById('clear-all-filters');
        if (clearButton) {
          clearButton.addEventListener('click', () => {
            // Reset search
            this.searchBar.reset();
            this.state.currentSearchQuery = '';
            
            // Reset date filter
            this.dateFilter.reset();
            this.state.currentFromDate = null;
            this.state.currentToDate = null;
            
            // Reset status filter
            this.state.currentStatusFilter = 'all';
            
            // Update view options dropdown
            const viewAllBtn = document.getElementById('view-all');
            const viewActiveBtn = document.getElementById('view-active');
            const viewCompletedBtn = document.getElementById('view-completed');
            const todoViewOptions = document.getElementById('todoViewOptions');
            
            if (viewAllBtn && viewActiveBtn && viewCompletedBtn && todoViewOptions) {
              viewAllBtn.classList.add('active');
              viewActiveBtn.classList.remove('active');
              viewCompletedBtn.classList.remove('active');
              todoViewOptions.innerHTML = '<i class="bi bi-gear"></i> All';
              todoViewOptions.classList.remove('filtered');
            }
            
            // Apply filters (which will now show all todos)
            this.applyFilters(true);
          });
        }
        
        filterStatusElement.classList.remove('d-none');
      } else {
        filterStatusElement.classList.add('d-none');
      }
    }
    
    // Update todo count badge
    const todoCountElement = document.getElementById('todo-count');
    if (todoCountElement) {
      todoCountElement.textContent = this.state.filteredTodos.length;
    }
  }
  
  /**
   * Updates layout based on screen size
   * This will be called on window resize events
   */
  updateResponsiveLayout() {
    // Check if we're on mobile
    const isMobile = window.innerWidth < 768;
    
    // Adjust layout based on screen size
    if (isMobile) {
      // Mobile-specific adjustments
      document.querySelectorAll('.desktop-only').forEach(el => {
        el.classList.add('d-none');
      });
      document.querySelectorAll('.mobile-only').forEach(el => {
        el.classList.remove('d-none');
      });
      
      // Show mobile action bar
      const mobileActionBar = document.querySelector('.fixed-bottom');
      if (mobileActionBar) {
        mobileActionBar.classList.remove('d-none');
      }
    } else {
      // Desktop-specific adjustments
      document.querySelectorAll('.desktop-only').forEach(el => {
        el.classList.remove('d-none');
      });
      document.querySelectorAll('.mobile-only').forEach(el => {
        el.classList.add('d-none');
      });
      
      // Hide mobile action bar
      const mobileActionBar = document.querySelector('.fixed-bottom');
      if (mobileActionBar) {
        mobileActionBar.classList.add('d-none');
      }
    }
  }
  
  /**
   * Adds a new todo to the current list without reloading from the API
   * @param {Object} newTodo - The new todo to add to the list
   * @private
   */
  _addTodoToCurrentList(newTodo) {
    if (!newTodo) return;
    
    // Add to allTodos array
    this.state.allTodos.unshift(newTodo);
    
    // Apply current filters to see if the new todo should be displayed
    let shouldDisplay = true;
    
    // Check search filter
    if (this.state.currentSearchQuery) {
      const query = this.state.currentSearchQuery.toLowerCase();
      const todoText = newTodo.title || newTodo.todo || '';
      shouldDisplay = todoText.toLowerCase().includes(query);
    }
    
    // Check date filter
    if (shouldDisplay && (this.state.currentFromDate || this.state.currentToDate)) {
      const todoDate = new Date(newTodo.createdAt);
      
      if (this.state.currentFromDate && !this.state.currentToDate) {
        shouldDisplay = todoDate >= this.state.currentFromDate;
      } else if (!this.state.currentFromDate && this.state.currentToDate) {
        shouldDisplay = todoDate <= this.state.currentToDate;
      } else if (this.state.currentFromDate && this.state.currentToDate) {
        shouldDisplay = todoDate >= this.state.currentFromDate && todoDate <= this.state.currentToDate;
      }
    }
    
    // Check status filter
    if (shouldDisplay && this.state.currentStatusFilter !== 'all') {
      if (this.state.currentStatusFilter === 'active') {
        shouldDisplay = !newTodo.completed;
      } else if (this.state.currentStatusFilter === 'completed') {
        shouldDisplay = newTodo.completed;
      }
    }
    
    // If the todo passes all filters, add it to filteredTodos
    if (shouldDisplay) {
      this.state.filteredTodos.unshift(newTodo);
      
      // Update pagination with new count
      this.pagination.updateTotalItems(this.state.filteredTodos.length, false);
      
      // If we're on the first page, update the UI to show the new todo
      if (this.state.currentPage === 1) {
        const itemsPerPage = config.pagination.itemsPerPage;
        const currentPageTodos = this.state.filteredTodos.slice(0, itemsPerPage);
        this.updateTodoListUI(currentPageTodos);
      }
    }
    
    // Update filter status and todo count
    this.updateFilterUI();
  }

  /**
   * Simple debounce function to limit how often a function is called
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} - Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create and initialize the TodoApp
  window.todoApp = new TodoApp();
});

// Export the TodoApp class for potential reuse
export { TodoApp };