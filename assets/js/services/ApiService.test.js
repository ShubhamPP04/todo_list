/**
 * ApiService Tests
 * 
 * This file contains tests for the ApiService class.
 * It tests the functionality of making HTTP requests and handling responses.
 */

// Import the ApiService class
import ApiService from './ApiService.js';

// Mock fetch for testing
const originalFetch = window.fetch;
let mockFetchImplementation;

// Setup and teardown
beforeEach(() => {
  // Mock fetch
  window.fetch = jest.fn().mockImplementation((...args) => {
    return mockFetchImplementation(...args);
  });
});

afterEach(() => {
  // Restore fetch
  window.fetch = originalFetch;
  jest.clearAllMocks();
});

describe('ApiService', () => {
  describe('constructor', () => {
    test('should initialize with default values', () => {
      const apiService = new ApiService();
      expect(apiService.baseUrl).toBe('');
      expect(apiService.defaultHeaders).toHaveProperty('Content-Type', 'application/json');
      expect(apiService.timeout).toBe(10000);
    });

    test('should initialize with provided values', () => {
      const options = {
        baseUrl: 'https://api.example.com',
        defaultHeaders: { 'X-API-Key': 'test-key' },
        timeout: 5000
      };
      const apiService = new ApiService(options);
      expect(apiService.baseUrl).toBe(options.baseUrl);
      expect(apiService.defaultHeaders).toHaveProperty('Content-Type', 'application/json');
      expect(apiService.defaultHeaders).toHaveProperty('X-API-Key', 'test-key');
      expect(apiService.timeout).toBe(options.timeout);
    });
  });

  describe('get', () => {
    test('should make a GET request with correct URL and headers', async () => {
      // Mock successful response
      mockFetchImplementation = jest.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: jest.fn().mockResolvedValue({ data: 'test' })
      });

      const apiService = new ApiService({ baseUrl: 'https://api.example.com' });
      const result = await apiService.get('/endpoint', {
        params: { key: 'value' },
        headers: { 'X-Custom': 'custom' }
      });

      // Check that fetch was called with correct arguments
      expect(window.fetch).toHaveBeenCalledWith(
        'https://api.example.com/endpoint?key=value',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Custom': 'custom'
          })
        })
      );

      // Check result
      expect(result).toEqual({ data: 'test' });
    });

    test('should handle error responses', async () => {
      // Mock error response
      mockFetchImplementation = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: jest.fn().mockResolvedValue({ message: 'Resource not found' })
      });

      const apiService = new ApiService({ baseUrl: 'https://api.example.com' });
      
      // Expect the request to throw an error
      await expect(apiService.get('/endpoint')).rejects.toThrow();
      
      // Check that fetch was called
      expect(window.fetch).toHaveBeenCalled();
    });

    test('should handle network errors', async () => {
      // Mock network error
      mockFetchImplementation = jest.fn().mockRejectedValue(new Error('Network error'));

      const apiService = new ApiService({ baseUrl: 'https://api.example.com' });
      
      // Expect the request to throw an error
      await expect(apiService.get('/endpoint')).rejects.toThrow();
      
      // Check that fetch was called
      expect(window.fetch).toHaveBeenCalled();
    });

    test('should handle timeout errors', async () => {
      // Mock timeout error
      const abortError = new Error('Timeout');
      abortError.name = 'AbortError';
      mockFetchImplementation = jest.fn().mockRejectedValue(abortError);

      const apiService = new ApiService({ 
        baseUrl: 'https://api.example.com',
        timeout: 100
      });
      
      // Expect the request to throw an error
      await expect(apiService.get('/endpoint')).rejects.toThrow();
      
      // Check that fetch was called
      expect(window.fetch).toHaveBeenCalled();
    });
  });

  describe('post', () => {
    test('should make a POST request with correct URL, headers, and body', async () => {
      // Mock successful response
      mockFetchImplementation = jest.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: jest.fn().mockResolvedValue({ id: 1, data: 'test' })
      });

      const apiService = new ApiService({ baseUrl: 'https://api.example.com' });
      const data = { name: 'Test', value: 123 };
      const result = await apiService.post('/endpoint', data, {
        headers: { 'X-Custom': 'custom' }
      });

      // Check that fetch was called with correct arguments
      expect(window.fetch).toHaveBeenCalledWith(
        'https://api.example.com/endpoint',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Custom': 'custom'
          }),
          body: JSON.stringify(data)
        })
      );

      // Check result
      expect(result).toEqual({ id: 1, data: 'test' });
    });

    test('should handle error responses', async () => {
      // Mock error response
      mockFetchImplementation = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: jest.fn().mockResolvedValue({ message: 'Invalid data' })
      });

      const apiService = new ApiService({ baseUrl: 'https://api.example.com' });
      const data = { invalid: 'data' };
      
      // Expect the request to throw an error
      await expect(apiService.post('/endpoint', data)).rejects.toThrow();
      
      // Check that fetch was called
      expect(window.fetch).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    test('should standardize error format', async () => {
      // Mock error response
      mockFetchImplementation = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: jest.fn().mockResolvedValue({ message: 'Resource not found' })
      });

      const apiService = new ApiService({ baseUrl: 'https://api.example.com' });
      
      try {
        await apiService.get('/endpoint');
        fail('Expected error was not thrown');
      } catch (error) {
        // Check standardized error format
        expect(error.standardized).toBeDefined();
        expect(error.standardized.code).toBe(404);
        expect(error.standardized.message).toBe('Resource not found');
        expect(error.standardized.retryable).toBe(false); // 404 is not retryable
      }
    });

    test('should mark server errors as retryable', async () => {
      // Mock server error response
      mockFetchImplementation = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockResolvedValue({ message: 'Server error' })
      });

      const apiService = new ApiService({ baseUrl: 'https://api.example.com' });
      
      try {
        await apiService.get('/endpoint');
        fail('Expected error was not thrown');
      } catch (error) {
        // Check that error is marked as retryable
        expect(error.standardized.retryable).toBe(true);
      }
    });

    test('should handle non-JSON responses', async () => {
      // Mock HTML error response
      mockFetchImplementation = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        text: jest.fn().mockResolvedValue('<html><body>Error page</body></html>')
      });

      const apiService = new ApiService({ baseUrl: 'https://api.example.com' });
      
      try {
        await apiService.get('/endpoint');
        fail('Expected error was not thrown');
      } catch (error) {
        // Check that error handling worked despite JSON parsing failure
        expect(error.standardized).toBeDefined();
        expect(error.standardized.code).toBe(500);
      }
    });
  });
});