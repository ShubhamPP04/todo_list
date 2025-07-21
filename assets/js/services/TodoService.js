/**
 * TodoService - Handles todo-specific API operations
 * Uses ApiService for HTTP requests and adds todo-specific functionality
 */
import ApiService from './ApiService.js';
import { config } from '../config.js';

export default class TodoService {
  /**
   * Creates a new TodoService instance
   * @param {Object} options - Configuration options
   * @param {ApiService} options.apiService - ApiService instance to use (optional)
   */
  constructor(options = {}) {
    // Use provided ApiService or create a new one
    this.apiService = options.apiService || new ApiService({
      baseUrl: config.apiBaseUrl
    });
    
    // Storage key for simulated creation dates
    this.STORAGE_KEY = 'todo_app_creation_dates';
    
    // Initialize creation dates from localStorage
    this.creationDates = this._loadCreationDates();
  }

  /**
   * Fetches todos from the API with pagination
   * @param {Object} options - Fetch options
   * @param {number} options.page - Page number (1-based)
   * @param {number} options.limit - Number of items per page
   * @returns {Promise<Object>} - Todos with pagination info
   */
  async fetchTodos(options = {}) {
    const page = options.page || 1;
    const limit = options.limit || config.pagination.itemsPerPage;
    const skip = (page - 1) * limit;
    
    try {
      // Get local todos first (they should always be available)
      const localTodos = this._getLocalTodos();
      
      try {
        // Get remote todos from API
        const response = await this.apiService.get(config.endpoints.todos, {
          params: {
            limit,
            skip
          }
        });
        
        // Transform the response to normalize data
        const transformedData = this._transformTodosResponse(response);
        
        // Save API todos to localStorage for persistence
        // This ensures we have a local copy of all todos
        transformedData.todos.forEach(todo => {
          if (!localTodos.some(lt => lt.id === todo.id)) {
            this._saveLocalTodo({
              ...todo,
              fromApi: true
            });
          }
        });
        
        // Filter out any local todos that have the same ID as API todos
        // to avoid duplicates (prefer API versions)
        const uniqueLocalTodos = localTodos.filter(
          localTodo => !transformedData.todos.some(apiTodo => apiTodo.id === localTodo.id)
        );
        
        // Combine remote and local todos
        if (uniqueLocalTodos.length > 0) {
          transformedData.todos = [...uniqueLocalTodos, ...transformedData.todos];
          transformedData.pagination.total += uniqueLocalTodos.length;
        }
        
        return transformedData;
      } catch (apiError) {
        console.error('Error fetching todos from API:', apiError);
        
        // API failed, use local todos as fallback
        console.log('Using local todos as fallback');
        return {
          todos: localTodos,
          pagination: {
            total: localTodos.length,
            limit: limit,
            skip: 0
          }
        };
      }
    } catch (error) {
      console.error('Error in fetchTodos:', error);
      throw error;
    }
  }

  /**
   * Adds a new todo via the API
   * @param {Object} todoData - Todo data to add
   * @param {string} todoData.title - Todo title/description
   * @param {boolean} todoData.completed - Todo completion status
   * @returns {Promise<Object>} - Created todo
   */
  async addTodo(todoData) {
    try {
      // Normalize the data for the API
      // DummyJSON expects 'todo' field, not 'title'
      const apiData = {
        todo: todoData.title || todoData.todo, // Support both field names
        completed: todoData.completed !== undefined ? todoData.completed : false,
        userId: todoData.userId || config.defaultUserId
      };
      
      console.log('Sending todo data to API:', apiData);
      
      // For DummyJSON, the API might not actually add the todo (it's a mock API)
      // So we'll handle both success and failure gracefully
      try {
        const response = await this.apiService.post(config.endpoints.addTodo, apiData);
        console.log('API response for add todo:', response);
        
        // Add creation date for the new todo
        const transformedTodo = this._transformTodoItem(response);
        
        // Also save to local storage for persistence
        this._saveLocalTodo({
          ...transformedTodo,
          fromApi: true // Mark as coming from API
        });
        
        return transformedTodo;
      } catch (apiError) {
        console.warn('API error when adding todo, using fallback:', apiError);
        
        // Create a fallback todo with a local ID
        const fallbackTodo = {
          id: Date.now(), // Use timestamp as a temporary ID
          title: apiData.todo,
          completed: apiData.completed,
          userId: apiData.userId,
          createdAt: new Date().toISOString(),
          isLocal: true // Mark as locally created
        };
        
        // Store in localStorage for persistence
        this._saveLocalTodo(fallbackTodo);
        
        return fallbackTodo;
      }
    } catch (error) {
      console.error('Error adding todo:', error);
      throw error;
    }
  }

  /**
   * Transforms API response to normalize data structure
   * @param {Object} response - API response
   * @returns {Object} - Normalized response
   * @private
   */
  _transformTodosResponse(response) {
    // Handle different API response formats
    let todos = [];
    let pagination = {};
    
    if (Array.isArray(response)) {
      // JSONPlaceholder format (array of todos)
      todos = response;
      pagination = {
        total: response.length,
        limit: response.length,
        skip: 0
      };
    } else {
      // DummyJSON format (object with todos array and pagination)
      todos = response.todos || [];
      pagination = {
        total: response.total || todos.length,
        limit: response.limit || config.pagination.itemsPerPage,
        skip: response.skip || 0
      };
    }
    
    // Transform each todo item
    const transformedTodos = todos.map(todo => this._transformTodoItem(todo));
    
    return {
      todos: transformedTodos,
      pagination
    };
  }

  /**
   * Transforms a single todo item to normalize data structure
   * @param {Object} todo - Todo item from API
   * @returns {Object} - Normalized todo item
   * @private
   */
  _transformTodoItem(todo) {
    // Create a normalized todo object
    const normalizedTodo = {
      id: todo.id,
      // Handle different field names (DummyJSON uses 'todo', JSONPlaceholder uses 'title')
      title: todo.todo || todo.title,
      completed: todo.completed !== undefined ? todo.completed : false,
      userId: todo.userId
    };
    
    // Add or retrieve creation date
    normalizedTodo.createdAt = this._getOrCreateTodoDate(todo.id);
    
    return normalizedTodo;
  }

  /**
   * Gets or creates a creation date for a todo
   * @param {number} todoId - Todo ID
   * @returns {string} - ISO date string
   * @private
   */
  _getOrCreateTodoDate(todoId) {
    if (this.creationDates[todoId]) {
      return this.creationDates[todoId];
    }
    
    // Create a simulated creation date
    // For consistency, base it on the ID (lower IDs are older)
    const now = new Date();
    const daysAgo = todoId % 30; // Simulate up to 30 days ago based on ID
    const creationDate = new Date(now);
    creationDate.setDate(now.getDate() - daysAgo);
    
    // Store the date
    this.creationDates[todoId] = creationDate.toISOString();
    this._saveCreationDates();
    
    return this.creationDates[todoId];
  }

  /**
   * Loads creation dates from localStorage
   * @returns {Object} - Map of todo IDs to creation dates
   * @private
   */
  _loadCreationDates() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading creation dates:', error);
      return {};
    }
  }

  /**
   * Saves creation dates to localStorage
   * @private
   */
  _saveCreationDates() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.creationDates));
    } catch (error) {
      console.error('Error saving creation dates:', error);
    }
  }
  
  /**
   * Saves a todo to localStorage
   * @param {Object} todo - The todo to save
   * @private
   */
  _saveLocalTodo(todo) {
    try {
      if (!todo || !todo.id) {
        console.warn('Cannot save todo without ID:', todo);
        return;
      }
      
      // Get existing local todos
      const LOCAL_TODOS_KEY = 'todo_app_local_todos';
      const storedTodos = localStorage.getItem(LOCAL_TODOS_KEY);
      let localTodos = storedTodos ? JSON.parse(storedTodos) : [];
      
      // Check if this todo already exists (by ID)
      const existingIndex = localTodos.findIndex(t => t.id === todo.id);
      
      if (existingIndex >= 0) {
        // Update existing todo
        localTodos[existingIndex] = {
          ...localTodos[existingIndex],
          ...todo,
          updatedAt: new Date().toISOString()
        };
        console.log('Updated existing todo in localStorage:', todo.id);
      } else {
        // Add the new todo
        localTodos.push({
          ...todo,
          savedAt: new Date().toISOString()
        });
        console.log('Added new todo to localStorage:', todo.id);
      }
      
      // Save back to localStorage
      localStorage.setItem(LOCAL_TODOS_KEY, JSON.stringify(localTodos));
    } catch (error) {
      console.error('Error saving local todo:', error);
    }
  }
  
  /**
   * Gets locally stored todos from localStorage
   * @param {Object} options - Options for filtering and sorting
   * @param {boolean} options.onlyLocal - Only return todos created locally
   * @param {string} options.sortBy - Field to sort by ('createdAt', 'title', etc.)
   * @param {boolean} options.sortDesc - Sort in descending order
   * @returns {Array} - Array of locally stored todos
   * @private
   */
  _getLocalTodos(options = {}) {
    try {
      const LOCAL_TODOS_KEY = 'todo_app_local_todos';
      const storedTodos = localStorage.getItem(LOCAL_TODOS_KEY);
      let todos = storedTodos ? JSON.parse(storedTodos) : [];
      
      // Filter if needed
      if (options.onlyLocal) {
        todos = todos.filter(todo => todo.isLocal);
      }
      
      // Sort if needed
      if (options.sortBy) {
        todos.sort((a, b) => {
          const aValue = a[options.sortBy];
          const bValue = b[options.sortBy];
          
          if (aValue < bValue) return options.sortDesc ? 1 : -1;
          if (aValue > bValue) return options.sortDesc ? -1 : 1;
          return 0;
        });
      } else {
        // Default sort by creation date (newest first)
        todos.sort((a, b) => {
          const aDate = new Date(a.createdAt || a.savedAt || 0);
          const bDate = new Date(b.createdAt || b.savedAt || 0);
          return bDate - aDate;
        });
      }
      
      return todos;
    } catch (error) {
      console.error('Error getting local todos:', error);
      return [];
    }
  }
}