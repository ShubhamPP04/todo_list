# Todo List App

A responsive and feature-rich Todo List application built with vanilla JavaScript, HTML, and CSS. This application allows users to manage their tasks with filtering, sorting, and offline capabilities.

## Features

- ✅ Create, view, and mark todos as completed
- 🔍 Search functionality to filter todos
- 📅 Date filtering to find todos by creation date
- 🔄 Status filtering (All, Active, Completed)
- 📱 Fully responsive design for mobile and desktop
- 🔢 Pagination for handling large lists of todos
- 💾 Local storage persistence for offline usage
- 🌐 API integration with fallback to local storage
- 🎨 Clean and modern UI with animations

## Demo

You can try the live demo [here](https://shubhampp04.github.io/todo_list/).

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Basic knowledge of HTML, CSS, and JavaScript (for development)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ShubhamPP04/todo_list.git
   ```

2. Navigate to the project directory:
   ```bash
   cd todo_list
   ```

3. Open `index.html` in your browser or use a local server:
   ```bash
   # Using Python's built-in server
   python -m http.server
   
   # Or using Node.js with http-server
   npx http-server
   ```

## Usage

### Adding a Todo

1. Enter your todo description in the input field
2. Optionally check "Mark as completed" if the todo is already completed
3. Click "Add Todo" button

### Filtering Todos

- **Search**: Type in the search box to filter todos by description
- **Date Filter**: Use the date pickers to filter todos by creation date
- **Status Filter**: Use the dropdown menu to filter by All, Active, or Completed status

### Mobile Features

On mobile devices, use the action bar at the bottom of the screen for quick access to:
- Filter
- Search
- Add new todo

## Project Structure

```
todo_list/
├── assets/
│   ├── css/
│   │   ├── components/
│   │   │   ├── date-filter.css
│   │   │   ├── error-handler.css
│   │   │   ├── filter-status.css
│   │   │   ├── loading-animations.css
│   │   │   ├── pagination.css
│   │   │   ├── search-bar.css
│   │   │   ├── todo-form.css
│   │   │   └── todo-list.css
│   │   └── main.css
│   └── js/
│       ├── components/
│       │   ├── DateFilter.js
│       │   ├── ErrorHandler.js
│       │   ├── Pagination.js
│       │   ├── SearchBar.js
│       │   ├── TodoForm.js
│       │   └── TodoList.js
│       ├── services/
│       │   ├── ApiService.js
│       │   └── TodoService.js
│       ├── app.js
│       └── config.js
├── index.html
├── todo-add-test.html
└── README.md
```

## Technical Details

### Architecture

The application follows a component-based architecture with:
- **Components**: Reusable UI elements with their own logic
- **Services**: Handle API communication and data management
- **Main App**: Orchestrates components and manages application state

### API Integration

The app uses the [DummyJSON](https://dummyjson.com) API for todo operations:
- GET `/todos` - Fetch todos
- POST `/todos/add` - Add a new todo

### Offline Support

The application implements a robust offline-first approach:
1. All todos are stored in localStorage
2. API calls are attempted first
3. If API fails, the app falls back to local storage
4. Local changes are tracked for future synchronization

## Development

### Adding New Features

1. Create new component files in `assets/js/components/`
2. Add corresponding CSS in `assets/css/components/`
3. Import and initialize the component in `app.js`

### Testing

Use the `todo-add-test.html` file to test the add todo functionality in isolation.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Bootstrap](https://getbootstrap.com/) for CSS framework
- [DummyJSON](https://dummyjson.com) for the mock API
- [Bootstrap Icons](https://icons.getbootstrap.com/) for icons

---

Made with ❤️ by [Shubham Kumar](https://github.com/ShubhamPP04)
