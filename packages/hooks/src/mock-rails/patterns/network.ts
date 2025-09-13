import type {MockPattern} from '../types';

export const NETWORK_PATTERNS: MockPattern[] = [
    {
        id: 'http.full-mock',
        module: 'http',
        pattern: /jest\.mock\(['"]http['"]\)/,
        category: 'system-boundary',
        testTypes: [], // Never appropriate
        risk: 'extreme',
        implementation: {
            code: `// ❌ BAD - Don't mock entire http module:
// jest.mock('http');

// ✅ GOOD - Mock http.request with realistic EventEmitter:
import * as http from 'http';
import { EventEmitter } from 'events';
import { Readable } from 'stream';

const mockRequest = new EventEmitter();
mockRequest.write = jest.fn();
mockRequest.end = jest.fn().mockImplementation(() => {
  process.nextTick(() => {
    const mockResponse = new Readable({
      read() {
        this.push('{"success": true}');
        this.push(null);
      }
    });
    mockResponse.statusCode = 200;
    mockResponse.headers = { 'content-type': 'application/json' };
    mockRequest.emit('response', mockResponse);
  });
});

jest.spyOn(http, 'request').mockReturnValue(mockRequest as any);

// Test your HTTP client logic
it('makes HTTP request correctly', async () => {
  const response = await makeHttpRequest('http://api.example.com/data');
  
  expect(response).toStrictEqual({ success: true });
});`,
            imports: [
                'import * as http from "http"',
                'import { EventEmitter } from "events"',
                'import { Readable } from "stream"',
            ],
        },
        education: {
            why: 'Completely replaces all HTTP functionality with empty mocks',
            falsePositiveRisk:
                'Extreme - test passes even if wrong methods are called or requests are malformed',
            whenAppropriate: 'Never - eliminates all network integration testing value',
            alternative: 'http.request.mock',
        },
    },

    {
        id: 'https.full-mock',
        module: 'https',
        pattern: /jest\.mock\(['"]https['"]\)/,
        category: 'system-boundary',
        testTypes: [], // Never appropriate
        risk: 'extreme',
        implementation: {
            code: `// ❌ BAD - Don't mock entire https module:
// jest.mock('https');

// ✅ GOOD - Mock https.request with realistic behavior:
import * as https from 'https';
import { EventEmitter } from 'events';
import { Readable } from 'stream';

const mockRequest = new EventEmitter();
mockRequest.write = jest.fn();
mockRequest.end = jest.fn().mockImplementation(() => {
  process.nextTick(() => {
    const mockResponse = new Readable({
      read() {
        this.push('{"data": "secure response"}');
        this.push(null);
      }
    });
    mockResponse.statusCode = 200;
    mockResponse.headers = { 
      'content-type': 'application/json',
      'x-secure': 'true'
    };
    mockRequest.emit('response', mockResponse);
  });
});

jest.spyOn(https, 'request').mockReturnValue(mockRequest as any);

// Test HTTPS client functionality
it('makes secure HTTPS request', async () => {
  const response = await makeSecureRequest('https://secure-api.example.com/data');
  
  expect(response).toStrictEqual({ data: 'secure response' });
});`,
            imports: [
                'import * as https from "https"',
                'import { EventEmitter } from "events"',
                'import { Readable } from "stream"',
            ],
        },
        education: {
            why: 'Completely replaces all HTTPS functionality with empty mocks',
            falsePositiveRisk:
                'Extreme - test passes even if wrong methods are called or requests are malformed',
            whenAppropriate: 'Never - eliminates all network integration testing value',
            alternative: 'https.request.mock',
        },
    },

    {
        id: 'http.request.mock',
        module: 'http',
        pattern: /jest\.spyOn\([^)]*http[^)]*,\s*['"]request['"]\)/,
        category: 'system-boundary',
        testTypes: ['unit'],
        risk: 'low',
        implementation: {
            code: `import * as http from 'http';
import { EventEmitter } from 'events';
import { Readable } from 'stream';

const mockRequest = new EventEmitter();
mockRequest.write = jest.fn();
mockRequest.end = jest.fn().mockImplementation(() => {
  process.nextTick(() => {
    const mockResponse = new Readable({
      read() {
        this.push('{"status": "success"}');
        this.push(null);
      }
    });
    mockResponse.statusCode = 200;
    mockResponse.headers = { 'content-type': 'application/json' };
    mockRequest.emit('response', mockResponse);
  });
});

jest.spyOn(http, 'request').mockReturnValue(mockRequest as any);`,
            imports: [
                'import * as http from "http"',
                'import { EventEmitter } from "events"',
                'import { Readable } from "stream"',
            ],
            setup: `let mockRequest: EventEmitter;
let mockResponse: Readable;

beforeEach(() => {
  mockRequest = new EventEmitter();
  mockRequest.write = jest.fn();
  mockRequest.end = jest.fn();
  
  mockResponse = new Readable({ read() {} });
  mockResponse.statusCode = 200;
  mockResponse.headers = {};
});`,
        },
        education: {
            why: 'Mocks HTTP requests with realistic request/response EventEmitter behavior',
            falsePositiveRisk: 'Low - still validates request options, headers, and response handling',
            whenAppropriate:
                'Unit tests that need to verify HTTP request logic without making actual network calls',
        },
    },

    {
        id: 'https.request.mock',
        module: 'https',
        pattern: /jest\.spyOn\([^)]*https[^)]*,\s*['"]request['"]\)/,
        category: 'system-boundary',
        testTypes: ['unit'],
        risk: 'low',
        implementation: {
            code: `import * as https from 'https';
import { EventEmitter } from 'events';
import { Readable } from 'stream';

const mockRequest = new EventEmitter();
mockRequest.write = jest.fn();
mockRequest.end = jest.fn().mockImplementation(() => {
  process.nextTick(() => {
    const mockResponse = new Readable({
      read() {
        this.push('{"status": "success"}');
        this.push(null);
      }
    });
    mockResponse.statusCode = 200;
    mockResponse.headers = { 'content-type': 'application/json' };
    mockRequest.emit('response', mockResponse);
  });
});

jest.spyOn(https, 'request').mockReturnValue(mockRequest as any);`,
            imports: [
                'import * as https from "https"',
                'import { EventEmitter } from "events"',
                'import { Readable } from "stream"',
            ],
        },
        education: {
            why: 'Mocks HTTPS requests with realistic request/response EventEmitter behavior',
            falsePositiveRisk: 'Low - still validates request options, headers, and response handling',
            whenAppropriate:
                'Unit tests that need to verify HTTPS request logic without making actual network calls',
        },
    },

    {
        id: 'fetch.global-mock',
        module: 'fetch',
        pattern: /global\.fetch\s*=|globalThis\.fetch\s*=/,
        category: 'system-boundary',
        testTypes: ['unit'],
        risk: 'low',
        implementation: {
            code: `// ✅ GOOD - Mock global fetch for unit testing:
beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => ({ users: ['Alice', 'Bob'] }),
    text: async () => 'plain text response',
    blob: async () => new Blob(['binary data']),
    arrayBuffer: async () => new ArrayBuffer(8),
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Test your fetch-based API calls
it('fetches user data correctly', async () => {
  const users = await getUsersFromAPI();
  
  expect(global.fetch).toHaveBeenCalledWith('/api/users', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  expect(users).toStrictEqual(['Alice', 'Bob']);
});

// Test error handling
it('handles fetch errors gracefully', async () => {
  (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
  
  await expect(getUsersFromAPI()).rejects.toThrow('Network error');
});`,
            imports: [],
            setup: `beforeEach(() => {
  (global.fetch as jest.Mock).mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});`,
        },
        education: {
            why: 'Mocks the global fetch function to control network requests',
            falsePositiveRisk: 'Low - still validates request URLs, options, and response handling',
            whenAppropriate: 'Unit tests for code using fetch() that need to avoid actual network calls',
        },
    },

    {
        id: 'fetch.jest-fetch-mock',
        module: 'fetch',
        pattern: /jest-fetch-mock|fetchMock/,
        category: 'system-boundary',
        testTypes: ['unit'],
        risk: 'low',
        implementation: {
            code: `import fetchMock from 'jest-fetch-mock';

// Enable fetch mocks
fetchMock.enableMocks();

// Mock specific responses
fetchMock.mockResponseOnce(JSON.stringify({ data: 'test' }));

// Or mock multiple calls
fetchMock
  .mockResponseOnce('first call')
  .mockResponseOnce('second call')
  .mockRejectOnce(new Error('API Error'));`,
            imports: ['import fetchMock from "jest-fetch-mock"'],
            setup: `import fetchMock from 'jest-fetch-mock';

beforeEach(() => {
  fetchMock.enableMocks();
  fetchMock.resetMocks();
});`,
        },
        education: {
            why: 'Uses a specialized library for comprehensive fetch mocking',
            falsePositiveRisk: 'Low - provides detailed control over request/response cycle',
            whenAppropriate: 'Unit tests that need sophisticated fetch mocking with multiple scenarios',
        },
    },

    {
        id: 'axios.mock',
        module: 'axios',
        pattern: /jest\.mock\(['"]axios['"]\)|axios.*\.__esModule/,
        category: 'third-party',
        testTypes: ['unit'],
        risk: 'medium',
        implementation: {
            code: `import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

mockedAxios.get.mockResolvedValue({
  data: { message: 'success' },
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {} as any,
});`,
            imports: ['import axios from "axios"'],
            setup: `beforeEach(() => {
  jest.clearAllMocks();
});`,
        },
        education: {
            why: 'Mocks axios HTTP client library',
            falsePositiveRisk: 'Medium - tests axios usage but not underlying HTTP behavior',
            whenAppropriate: 'Unit tests for code that uses axios specifically',
            alternative: 'network.test-server',
        },
    },

    {
        id: 'network.nock',
        module: 'network',
        pattern: /nock\(/,
        category: 'system-boundary',
        testTypes: ['integration'],
        risk: 'low',
        implementation: {
            code: `import nock from 'nock';

// Intercept HTTP calls to specific endpoints
const scope = nock('https://api.example.com')
  .get('/users')
  .reply(200, { users: [] })
  .post('/users')
  .reply(201, { id: 1, name: 'John' });

// Your test code makes real HTTP calls but nock intercepts them
const response = await fetch('https://api.example.com/users');

// Verify all mocks were called
expect(scope.isDone()).toBe(true);`,
            imports: ['import nock from "nock"'],
            setup: `beforeEach(() => {
  nock.cleanAll();
});

afterEach(() => {
  nock.cleanAll();
  nock.restore();
});`,
        },
        education: {
            why: 'Intercepts real HTTP calls at the network level with controlled responses',
            falsePositiveRisk: 'Low - exercises real HTTP code paths while controlling responses',
            whenAppropriate:
                'Integration tests that need to test HTTP client code with predictable responses',
        },
    },

    {
        id: 'network.test-server',
        module: 'network',
        pattern: /createServer.*listen|express\(\).*listen/,
        category: 'system-boundary',
        testTypes: ['integration', 'e2e'],
        risk: 'none',
        implementation: {
            code: `import express from 'express';
import http from 'http';

// Create a real HTTP server for testing
const app = express();
app.get('/test', (req, res) => res.json({ status: 'ok' }));

const server = http.createServer(app);
await new Promise(resolve => server.listen(0, resolve));

const port = (server.address() as any).port;
const baseUrl = \`http://localhost:\${port}\`;

// Test against real server
const response = await fetch(\`\${baseUrl}/test\`);`,
            imports: ['import express from "express"', 'import http from "http"'],
            setup: `let server: http.Server;
let baseUrl: string;

beforeEach(async () => {
  const app = express();
  // Configure test routes...
  
  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  
  const port = (server.address() as any).port;
  baseUrl = \`http://localhost:\${port}\`;
});

afterEach(async () => {
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
});`,
        },
        education: {
            why: 'Uses a real HTTP server for testing network interactions',
            falsePositiveRisk: 'None - exercises complete HTTP request/response cycle',
            whenAppropriate: 'Integration/E2E tests that need to verify real network behavior',
        },
    },
];
