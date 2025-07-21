# Design Document

## Overview

The Todo List application will be a modern, responsive web application built with HTML, CSS (Bootstrap), and ES6 JavaScript. It will integrate with a dummy API (either dummyjson.com or jsonplaceholder.typicode.com) to fetch and manage todo items. The application will feature a clean, intuitive interface with functionality for viewing, searching, filtering, adding todos, and handling errors gracefully.

## Architecture

The application will follow a modular architecture with clear separation of concerns:

```
todo-list-app/
├── index.html              # Main HTML entry point
├── assets/
│   ├── css/
│   │   ├── main.css        # Custom styles
│   │   └── components/     # Component-specific styles
│   └── js/
│       ├── app.js          # Application entry point
│       ├── config.js       # Configuration (API URLs, etc.)
│       ├── components/     # UI components
│       │   ├── TodoList.js
│       │   ├── TodoForm.js
│       │   ├── SearchBar.js
│       │   ├── DateFilter.js
│       │   ├── Pagination.js
│       │   └── ErrorHandler.js
│       ├── services/       # API and data services
│       │   ├── ApiService.js
│       │   └── TodoService.js
│       └── utils/          # Helper functions
│           ├── dateUtils.js
│           └── validators.js
```

The architecture follows these principles:
- **Modularity**: Each component has a single responsibility
- **Reusability**: Components are designed to be reused across the application
- **Maintainability**: Clear separation of concerns makes the code easier to maintain
- **Scalability**: The structure allows for easy addition of new features

## Components and Interfaces

### Core Components

1. **TodoList Component**
   - Responsible for rendering the list of todos
   - Handles the display of loading states and empty states
   - Interfaces with TodoService to get data
   - Emits events when todos are selected or actions are performed

2. **TodoForm Component**
   - Manages the form for adding new todos
   - Handles form validation and submission
   - Interfaces with TodoService to save new todos
   - Provides feedback on submission status

3. **SearchBar Component**
   - Manages the search input for filtering todos by name
   - Performs real-time filtering as the user types
   - Emits events when search criteria change

4. **DateFilter Component**
   - Manages the date range inputs for filtering todos by creation date
   - Validates date ranges and applies filters
   - Emits events when date filters change

5. **Pagination Component**
   - Handles client-side pagination of todo items
   - Renders page navigation controls
   - Manages current page state
   - Emits events when page changes

6. **ErrorHandler Component**
   - Displays error messages in a user-friendly way
   - Provides retry options when applicable
   - Manages different types of errors (network, validation, etc.)

### Services

1. **ApiService**
   - Provides a wrapper around fetch/axios for making API calls
   - Handles common HTTP operations (GET, POST)
   - Manages request headers and authentication if needed
   - Standardizes error handling for API calls

2. **TodoService**
   - Uses ApiService to interact with the todo API endpoints
   - Provides methods for fetching, creating, and managing todos
   - Handles data transformation between API and application formats
   - Implements caching if needed for performance

### Utilities

1. **dateUtils**
   - Provides functions for date formatting and comparison
   - Handles date validation for filters
   - Note: Since APIs don't provide creation dates, we'll simulate them client-side

2. **validators**
   - Contains validation functions for form inputs
   - Ensures data integrity before API calls

## API Integration Details

### Endpoint Configuration

The application will use DummyJSON as the primary API with the following endpoints:

- **GET Todos**: `https://dummyjson.com/todos?limit=10&skip=0`
  - Returns paginated list of todos
  - Supports limit and skip parameters for pagination
  
- **POST Todo**: `https://dummyjson.com/todos/add`
  - Creates a new todo
  - Expects JSON body with `todo`, `completed`, and `userId` fields
  - Returns the created todo with assigned ID

### Data Transformation

Since the APIs don't provide creation dates, the application will:
1. Add a `createdAt` timestamp when fetching todos (simulated based on ID or current time)
2. Store creation dates in localStorage for persistence across sessions
3. Use these dates for the date filtering functionality

### Error Handling Strategy

- **Network Errors**: Retry mechanism with exponential backoff
- **API Errors**: Display user-friendly messages based on status codes
- **Data Validation**: Client-side validation before API calls
- **Fallback**: Graceful degradation when API is unavailable

## Data Models

### API Configuration

The application will support two dummy APIs:

1. **DummyJSON API** (Primary choice)
   - Base URL: `https://dummyjson.com`
   - GET todos: `/todos?limit={limit}&skip={skip}`
   - POST todo: `/todos/add`

2. **JSONPlaceholder API** (Alternative)
   - Base URL: `https://jsonplaceholder.typicode.com`
   - GET todos: `/todos?_limit={limit}&_start={start}`
   - POST todo: `/todos`

### Todo Item (DummyJSON format)

```javascript
/**
 * @typedef {Object} Todo
 * @property {number} id - Unique identifier
 * @property {string} todo - The todo description (DummyJSON uses 'todo' field)
 * @property {boolean} completed - Whether the todo is completed
 * @property {number} userId - ID of user who created the todo
 */
```

### Todo Item (JSONPlaceholder format)

```javascript
/**
 * @typedef {Object} Todo
 * @property {number} id - Unique identifier
 * @property {string} title - The todo title (JSONPlaceholder uses 'title' field)
 * @property {boolean} completed - Whether the todo is completed
 * @property {number} userId - ID of user who created the todo
 */
```

### API Response Format (DummyJSON)

```javascript
/**
 * @typedef {Object} ApiResponse
 * @property {Array<Todo>} todos - Array of todo items
 * @property {number} total - Total number of todos available
 * @property {number} skip - Number of items skipped (for pagination)
 * @property {number} limit - Maximum number of items returned
 */
```

### API Response Format (JSONPlaceholder)

```javascript
/**
 * Returns array of todos directly, no wrapper object
 * @typedef {Array<Todo>} ApiResponse
 */
```

### Form Data (DummyJSON)

```javascript
/**
 * @typedef {Object} TodoFormData
 * @property {string} todo - The todo description
 * @property {boolean} [completed] - Whether the todo is completed (default: false)
 * @property {number} [userId] - ID of user creating the todo (default: 1)
 */
```

### Form Data (JSONPlaceholder)

```javascript
/**
 * @typedef {Object} TodoFormData
 * @property {string} title - The todo title
 * @property {boolean} [completed] - Whether the todo is completed (default: false)
 * @property {number} [userId] - ID of user creating the todo (default: 1)
 */
```

## Error Handling

The application will implement a comprehensive error handling strategy:

1. **API Error Handling**
   - Network errors (offline, timeout)
   - Server errors (500 range)
   - Client errors (400 range)
   - Invalid data responses

2. **User Input Validation**
   - Form field validation with meaningful error messages
   - Date range validation for filters

3. **Error Display Strategy**
   - Non-intrusive error messages for minor issues
   - Modal dialogs for critical errors
   - Inline validation messages for form fields
   - Global error state management for application-wide issues

4. **Recovery Mechanisms**
   - Retry options for failed API calls
   - Graceful degradation when features are unavailable
   - Data persistence to prevent loss during errors

## Testing Strategy

Although not explicitly mentioned in the requirements, a robust testing strategy is recommended:

1. **Unit Testing**
   - Test individual components and services in isolation
   - Validate business logic and utility functions

2. **Integration Testing**
   - Test interactions between components
   - Verify API service integration with mock responses

3. **UI Testing**
   - Validate responsive design across device sizes
   - Ensure accessibility compliance

4. **Manual Testing Checklist**
   - Verify all user stories and acceptance criteria
   - Test edge cases and error scenarios
   - Cross-browser compatibility testing

## User Interface Design

The application will feature a clean, modern interface using Bootstrap for responsive layout and styling:

### Layout

```
+-----------------------------------------------+
| Todo List App                                 |
+-----------------------------------------------+
| [Search] [From Date] [To Date] [Filter]       |
+-----------------------------------------------+
| [+ Add New Todo]                              |
+-----------------------------------------------+
| Todo List:                                    |
|                                               |
| □ Task 1 - Created: 2023-07-15                |
| ✓ Task 2 - Created: 2023-07-14                |
| □ Task 3 - Created: 2023-07-13                |
|                                               |
+-----------------------------------------------+
| < 1 2 3 ... >                                 |
+-----------------------------------------------+
```

### Color Scheme

- Primary: Bootstrap primary blue (#0d6efd)
- Secondary: Light gray (#f8f9fa)
- Success: Green (#198754)
- Danger: Red (#dc3545)
- Warning: Yellow (#ffc107)
- Info: Cyan (#0dcaf0)
- Text: Dark gray (#212529)
- Background: White (#ffffff)

### Typography

- Font Family: Bootstrap default (system-ui, -apple-system, etc.)
- Headings: Bold, slightly larger than body text
- Body Text: Regular weight, readable size (16px)
- Small Text: For metadata like dates (14px)

### Component Styling

1. **Todo Items**
   - Card-based design with subtle shadows
   - Clear visual distinction between completed and pending todos
   - Hover effects for interactive elements

2. **Forms**
   - Clean, aligned form controls
   - Clear labels and placeholder text
   - Visual feedback for validation states

3. **Buttons**
   - Consistent styling across the application
   - Clear visual hierarchy (primary, secondary actions)
   - Disabled states during loading/processing

4. **Loading States**
   - Subtle spinners or progress indicators
   - Skeleton screens for content loading

5. **Error States**
   - Color-coded error messages
   - Appropriate icons to draw attention
   - Clear instructions for resolution when possible