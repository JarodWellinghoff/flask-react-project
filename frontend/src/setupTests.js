// frontend/src/setupTests.js
import "@testing-library/jest-dom";

// Mock EventSource for SSE tests
global.EventSource = jest.fn(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  close: jest.fn(),
  readyState: 0,
  onopen: null,
  onmessage: null,
  onerror: null,
  CONNECTING: 0,
  OPEN: 1,
  CLOSED: 2,
}));
