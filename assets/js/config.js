/**
 * Application Configuration
 * 
 * This file contains configuration settings for the Todo List application.
 * It includes API endpoints, pagination settings, and other global configuration.
 */

export const config = {
  // API Configuration
  apiBaseUrl: 'https://dummyjson.com',
  endpoints: {
    todos: '/todos',
    addTodo: '/todos/add',
    updateTodo: '/todos'  // Added for future toggle functionality
  },
  
  // Pagination Configuration
  pagination: {
    itemsPerPage: 10,
    maxVisiblePages: 5
  },
  
  // Default User ID for new todos
  defaultUserId: 1,
  
  // Application Settings
  appName: 'Todo List App',
  
  // Feature Flags
  features: {
    enableDateFiltering: true,
    enableSearch: true,
    enablePagination: true
  }
};