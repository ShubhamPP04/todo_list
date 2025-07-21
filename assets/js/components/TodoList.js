/**
 * TodoList Component
 * 
 * Responsible for rendering the list of todos, handling loading states,
 * empty states, and error display.
 */
export default class TodoList {
  /**
   * Creates a new TodoList instance
   * @param {Object} options - Configuration options
   * @param {string} options.containerId - ID of the container element
   * @param {string} options.loadingStateId - ID of the loading state element
   * @param {string} options.emptyStateId - ID of the empty state element
   * @param {string} options.errorStateId - ID of the error state element
   * @param {Function} options.onTodoToggle - Callback when a todo is toggled
   */
  constructor(options = {}) {
    // Store DOM element references
    this.container = document.getElementById(options.containerId || 'todoList');
    this.loadingState = document.getElementById(options.loadingStateId || 'loadingState');
    this.emptyState = document.getElementById(options.emptyStateId || 'emptyState');
    this.errorState = document.getElementById(options.errorStateId || 'errorState');
    this.errorMessage = document.getElementById('errorMessage');
    this.retryButton = document.getElementById('retryButton');
    
    // Store callback functions
    this.onTodoToggle = options.onTodoToggle || (() => {});
    
    // Bind event handlers
    this._bindEvents();
  }

  /**
   * Binds event handlers to DOM elements
   * @private
   */
  _bindEvents() {
    // Delegate click events on the todo list
    if (this.container) {
      this.container.addEventListener('click', (event) => {
        // Handle checkbox clicks
        if (event.target.classList.contains('todo-checkbox')) {
          const todoId = parseInt(event.target.dataset.todoId, 10);
          const completed = event.target.checked;
          this.onTodoToggle(todoId, completed);
          
          // Update UI immediately for better UX
          const todoItem = event.target.closest('.todo-item');
          if (todoItem) {
            todoItem.classList.toggle('completed', completed);
          }
        }
      });
    }
    
    // Add retry button handler
    if (this.retryButton) {
      this.retryButton.addEventListener('click', () => {
        // Dispatch a custom event that can be listened for in app.js
        const event = new CustomEvent('todo-list:retry');
        document.dispatchEvent(event);
      });
    }
  }

  /**
   * Shows the loading state and hides other states
   */
  showLoading() {
    this._hideAllStates();
    if (this.loadingState) {
      this.loadingState.classList.remove('d-none');
    }
  }

  /**
   * Shows the empty state and hides other states
   */
  showEmpty() {
    this._hideAllStates();
    if (this.emptyState) {
      // Reset to default empty state message
      const messageElement = this.emptyState.querySelector('p');
      if (messageElement) {
        messageElement.textContent = 'No todos found. Add a new one to get started!';
      }
      this.emptyState.classList.remove('d-none');
    }
  }
  
  /**
   * Shows the empty state with a custom message and hides other states
   * @param {string} message - Custom message to display
   */
  showCustomEmpty(message) {
    this._hideAllStates();
    if (this.emptyState) {
      // Set custom message
      const messageElement = this.emptyState.querySelector('p');
      if (messageElement) {
        messageElement.textContent = message;
      }
      this.emptyState.classList.remove('d-none');
    }
  }

  /**
   * Shows the error state with a message and hides other states
   * @param {string} message - Error message to display
   */
  showError(message = 'Unable to load todos. Please try again later.') {
    this._hideAllStates();
    if (this.errorState) {
      this.errorState.classList.remove('d-none');
      if (this.errorMessage) {
        this.errorMessage.textContent = message;
      }
    }
  }



  /**
   * Creates a DOM element for a todo item
   * @param {Object} todo - Todo object
   * @returns {HTMLElement} - List item element
   * @private
   */
  _createTodoElement(todo) {
    const li = document.createElement('li');
    li.className = `list-group-item todo-item ${todo.completed ? 'completed' : ''}`;
    li.dataset.todoId = todo.id;
    
    // Create checkbox wrapper for better touch target
    const checkboxWrapper = document.createElement('div');
    checkboxWrapper.className = 'form-check';
    
    // Create checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'form-check-input todo-checkbox';
    checkbox.id = `todo-checkbox-${todo.id}`;
    checkbox.checked = todo.completed;
    checkbox.dataset.todoId = todo.id;
    checkbox.setAttribute('aria-label', `Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`);
    
    // Add keyboard event handling for better accessibility
    checkbox.addEventListener('keydown', (e) => {
      // Handle space and enter keys
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        checkbox.checked = !checkbox.checked;
        
        // Trigger the change event manually
        const changeEvent = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(changeEvent);
        
        // Call the toggle callback
        this.onTodoToggle(todo.id, checkbox.checked);
        
        // Update UI
        const todoItem = checkbox.closest('.todo-item');
        if (todoItem) {
          todoItem.classList.toggle('completed', checkbox.checked);
        }
      }
    });
    
    // Create content wrapper for better layout
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'd-flex flex-column flex-md-row justify-content-between align-items-md-center w-100 ms-2';
    
    // Create todo text with label for checkbox (for accessibility)
    const todoText = document.createElement('label');
    todoText.className = 'todo-text mb-1 mb-md-0';
    todoText.htmlFor = `todo-checkbox-${todo.id}`;
    todoText.textContent = todo.title;
    
    // Add local indicator if it's a locally stored todo
    if (todo.isLocal) {
      const localBadge = document.createElement('span');
      localBadge.className = 'badge bg-warning text-dark ms-2';
      localBadge.textContent = 'Local';
      todoText.appendChild(localBadge);
    }
    
    // Create date element
    const todoDate = document.createElement('small');
    todoDate.className = 'todo-date text-muted';
    todoDate.textContent = this._formatDate(todo.createdAt);
    
    // Assemble todo item
    checkboxWrapper.appendChild(checkbox);
    contentWrapper.appendChild(todoText);
    contentWrapper.appendChild(todoDate);
    
    li.appendChild(checkboxWrapper);
    li.appendChild(contentWrapper);
    
    // Add animation for newly added items
    if (todo.id && !this._previouslyRenderedIds?.includes(todo.id)) {
      li.classList.add('just-added');
      setTimeout(() => {
        li.classList.remove('just-added');
      }, 2000);
    }
    
    return li;
  }
  
  /**
   * Renders todos in the container element
   * @param {Array<Object>} todos - Array of todo objects
   */
  render(todos = []) {
    // Hide all states first
    this._hideAllStates();
    
    // Show empty state if no todos
    if (!todos || todos.length === 0) {
      this.showEmpty();
      return;
    }
    
    // Store IDs of currently rendered todos for animation purposes
    this._previouslyRenderedIds = todos.map(todo => todo.id);
    
    // Clear existing todos
    if (this.container) {
      this.container.innerHTML = '';
      
      // Create and append todo items
      todos.forEach(todo => {
        const todoElement = this._createTodoElement(todo);
        this.container.appendChild(todoElement);
      });
    }
  }

  /**
   * Formats a date string for display
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date
   * @private
   */
  _formatDate(dateString) {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return `Created: ${date.toLocaleDateString()}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }

  /**
   * Hides all state elements (loading, empty, error)
   * @private
   */
  _hideAllStates() {
    if (this.loadingState) {
      this.loadingState.classList.add('d-none');
    }
    if (this.emptyState) {
      this.emptyState.classList.add('d-none');
    }
    if (this.errorState) {
      this.errorState.classList.add('d-none');
    }
  }
}