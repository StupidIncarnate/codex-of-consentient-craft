import type {MockPattern} from '../types';

export const APPLICATION_CODE_PATTERNS: MockPattern[] = [
    {
        id: 'application-code.relative-import',
        module: 'application-code',
        pattern: /jest\.mock\(['"]\.\.?\/[^'"]*['"]\)/,
        category: 'application-code',
        testTypes: [], // Never appropriate
        risk: 'extreme',
        implementation: {
            code: `// ❌ BAD - Don't mock application code:
// jest.mock('./my-module');
// jest.mock('../utils/helper');

// ✅ GOOD - Test through real modules, mock system boundaries:
import { myFunction } from './my-module';
import * as fs from 'fs/promises';

// Mock external dependencies, not your code
jest.spyOn(fs, 'readFile').mockResolvedValue('test data');

// Test the real application logic
const result = await myFunction();
expect(result).toStrictEqual({ processed: 'test data' });`,
            imports: ['import * as fs from "fs/promises"'],
        },
        education: {
            why: 'Mocking your own application code defeats the purpose of testing - you want to verify the real integration between your modules',
            falsePositiveRisk:
                'Extreme - test passes even when actual module logic is broken or integration fails',
            whenAppropriate: 'Never - test through the real application code',
            alternative:
                'Mock only external dependencies at system boundaries (child_process, fs, network)',
        },
    },

    {
        id: 'application-code.utils-mock',
        module: 'application-code',
        pattern: /jest\.mock\(['"][^'"]*\/utils\/[^'"]*['"]\)/,
        category: 'application-code',
        testTypes: [], // Never appropriate
        risk: 'extreme',
        implementation: {
            code: `// ❌ BAD - Don't mock utility functions:
// jest.mock('./utils/file-helper');
// jest.mock('../utils/string-utils');

// ✅ GOOD - Test utilities directly, mock their dependencies:
import { processFile } from './utils/file-helper';
import * as fs from 'fs/promises';

// Mock the system dependency, not the utility
jest.spyOn(fs, 'readFile').mockResolvedValue('test content');

// Test the real utility logic
it('processes file content correctly', async () => {
  const result = await processFile('test.txt');
  expect(result).toStrictEqual({ lines: 1, words: 2 });
});`,
            imports: ['import * as fs from "fs/promises"'],
        },
        education: {
            why: 'Utility functions are core application logic that should be tested, not mocked',
            falsePositiveRisk: 'Extreme - utility bugs will not be caught since the real code never runs',
            whenAppropriate:
                'Never - utilities should be fast and pure, making them ideal for real testing',
            alternative: "Test the real utilities - if they're slow, refactor them to be faster",
        },
    },

    {
        id: 'application-code.service-mock',
        module: 'application-code',
        pattern: /jest\.mock\(['"][^'"]*\/(?:services?|controllers?)\/[^'"]*['"]\)/,
        category: 'application-code',
        testTypes: [], // Never appropriate
        risk: 'extreme',
        implementation: {
            code: `// ❌ BAD - Don't mock services/controllers:
// jest.mock('./services/user-service');
// jest.mock('../controllers/auth-controller');

// ✅ GOOD - Test real services, mock their external dependencies:
import { UserService } from './services/user-service';
import { fetch } from 'global';

// Mock external API, not the service
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ id: 1, name: 'John' })
});

// Test the real business logic
it('creates user successfully', async () => {
  const userService = new UserService();
  const result = await userService.createUser({ name: 'John' });
  
  expect(result).toStrictEqual({ id: 1, name: 'John' });
  expect(fetch).toHaveBeenCalledWith('/api/users', { 
    method: 'POST', 
    body: JSON.stringify({ name: 'John' })
  });
});`,
            imports: [],
        },
        education: {
            why: "Services and controllers contain your business logic - mocking them means you're not testing your actual application",
            falsePositiveRisk: 'Extreme - business logic bugs will not be caught',
            whenAppropriate: 'Never - use dependency injection and mock external dependencies instead',
            alternative:
                'Mock the external dependencies (database, APIs) that services use, not the services themselves',
        },
    },

    {
        id: 'application-code.config-mock',
        module: 'application-code',
        pattern: /jest\.mock\(['"][^'"]*\/config[^'"]*['"]\)/,
        category: 'application-code',
        testTypes: [], // Usually inappropriate
        risk: 'high',
        implementation: {
            code: `// ❌ BAD - Don't mock configuration:
// jest.mock('./config/database');
// jest.mock('../config/app-config');

// ✅ GOOD - Use test-specific config or env vars:
import { loadConfig } from './config/app-config';

// Override config for tests
const originalEnv = process.env.NODE_ENV;
beforeEach(() => {
  process.env.NODE_ENV = 'test';
  process.env.DB_URL = 'sqlite::memory:';
  process.env.API_KEY = 'test-key';
});

afterEach(() => {
  process.env.NODE_ENV = originalEnv;
});

// Test with real config logic
it('loads test configuration', () => {
  const config = loadConfig();
  expect(config.database.url).toBe('sqlite::memory:');
  expect(config.apiKey).toBe('test-key');
});`,
            imports: [],
        },
        education: {
            why: 'Config modules should provide real configuration during testing - mocking them hides configuration errors',
            falsePositiveRisk: 'High - configuration bugs and validation errors will not be caught',
            whenAppropriate:
                'Rarely - only when config has side effects like connecting to external services',
            alternative: 'Use test-specific config files or environment variables instead of mocking',
        },
    },

    {
        id: 'application-code.internal-class',
        module: 'application-code',
        pattern: /jest\.spyOn\([^)]*,\s*['"]_[^'"]*['"]\)/,
        category: 'application-code',
        testTypes: [], // Never appropriate
        risk: 'extreme',
        implementation: {
            code: `// ❌ BAD - Don't test private methods:
// jest.spyOn(myObject, '_privateMethod');
// jest.spyOn(instance, '_internalHelper');

// ✅ GOOD - Test through public interface:
import { DataProcessor } from './data-processor';

it('processes data correctly', () => {
  const processor = new DataProcessor();
  
  // Test the public behavior, not internal methods
  const result = processor.processData(['item1', 'item2']);
  
  // Verify the observable outcome
  expect(result).toStrictEqual({
    processed: ['ITEM1', 'ITEM2'],
    count: 2
  });
});

// If you need to verify side effects, use public APIs
it('logs processing activity', () => {
  const consoleSpy = jest.spyOn(console, 'log');
  const processor = new DataProcessor();
  
  processor.processData(['item1']);
  
  expect(consoleSpy).toHaveBeenCalledWith('Processed 1 items');
});`,
            imports: [],
        },
        education: {
            why: 'Testing private/internal methods couples tests to implementation details instead of behavior',
            falsePositiveRisk:
                'Extreme - tests break when you refactor internal implementation, even if behavior is unchanged',
            whenAppropriate: 'Never - test the public interface and verify the observable behavior',
            alternative: 'Test through public methods and verify the final output/side effects',
        },
    },

    {
        id: 'application-code.constructor-spy',
        module: 'application-code',
        pattern: /jest\.spyOn\([^)]*,\s*['"]constructor['"]\)/,
        category: 'application-code',
        testTypes: [], // Usually inappropriate
        risk: 'high',
        implementation: {
            code: `// ❌ BAD - Don't spy on constructors:
// jest.spyOn(MyClass, 'constructor');

// ✅ GOOD - Test object behavior, not construction:
import { UserService } from './user-service';

it('creates user service with correct behavior', () => {
  const service = new UserService({ apiUrl: 'https://api.test.com' });
  
  // Test what the object does, not how it's constructed
  expect(service.getApiUrl()).toBe('https://api.test.com');
});

// If you need to track object creation, use factory pattern:
const createUserService = jest.fn((options) => new UserService(options));

it('factory creates service correctly', () => {
  const service = createUserService({ apiUrl: 'test.com' });
  
  expect(createUserService).toHaveBeenCalledWith({ apiUrl: 'test.com' });
  expect(service).toBeInstanceOf(UserService);
});`,
            imports: [],
        },
        education: {
            why: 'Spying on constructors typically indicates testing implementation rather than behavior',
            falsePositiveRisk: 'High - focuses on how objects are created rather than what they do',
            whenAppropriate: 'Rarely - only when constructor has important side effects',
            alternative: 'Test the behavior of the created objects, not their construction',
        },
    },

    {
        id: 'application-code.module-internals',
        module: 'application-code',
        pattern: /\.__esModule\s*=|\.default\s*=.*mock/,
        category: 'application-code',
        testTypes: [], // Usually inappropriate
        risk: 'high',
        implementation: {
            code: `// ❌ BAD - Don't manipulate module internals:
// jest.mock('./my-module');
// (MyModule as any).__esModule = true;
// (MyModule as any).default = mockImplementation;

// ✅ GOOD - Use clean mocking or dependency injection:
import { processData } from './my-module';
import * as fs from 'fs/promises';

// Mock system dependencies, not module internals
jest.spyOn(fs, 'readFile').mockResolvedValue('test data');

// Or use proper Jest mocking for third-party modules
jest.mock('third-party-lib', () => ({
  processData: jest.fn().mockReturnValue('processed'),
  __esModule: true, // Only for third-party compatibility
}));

// Test through clean interfaces
it('processes data correctly', async () => {
  const result = await processData('input');
  expect(result).toBe('processed test data');
});`,
            imports: ['import * as fs from "fs/promises"'],
        },
        education: {
            why: 'Manipulating module internals creates brittle tests tied to bundler implementation details',
            falsePositiveRisk: 'High - tests may pass in Jest but fail in actual bundled code',
            whenAppropriate: 'Rarely - only for very specific module loading edge cases',
            alternative: 'Mock at system boundaries or use dependency injection',
        },
    },

    {
        id: 'application-code.deep-property-mock',
        module: 'application-code',
        pattern: /\w+\.\w+\.\w+\.mock(?:Implementation|ReturnValue)/,
        category: 'application-code',
        testTypes: [], // Usually inappropriate
        risk: 'high',
        implementation: {
            code: `// ❌ BAD - Don't mock deep object properties:
// myObject.service.api.mockImplementation(() => 'fake');
// app.database.connection.mockReturnValue(mockDb);

// ✅ GOOD - Inject dependencies and mock at boundaries:
class MyService {
  constructor(private dependencies: { api: ApiService }) {}
  
  async processData() {
    return await this.dependencies.api.fetchData();
  }
}

// In tests - mock the injected dependency
it('processes data correctly', async () => {
  const mockApi = { fetchData: jest.fn().mockResolvedValue('data') };
  const service = new MyService({ api: mockApi });
  
  const result = await service.processData();
  
  expect(result).toBe('data');
  expect(mockApi.fetchData).toHaveBeenCalledTimes(1);
});

// Or use factory/builder pattern:
const createService = ({ api = defaultApi } = {}) => new MyService({ api });`,
            imports: [],
        },
        education: {
            why: 'Deep property mocking creates tight coupling to internal object structure',
            falsePositiveRisk:
                'High - tests break when internal structure changes, even if behavior is correct',
            whenAppropriate: "Rarely - only when you can't control the dependency injection",
            alternative: 'Inject dependencies at construction time and mock at the boundaries',
        },
    },

    {
        id: 'application-code.prototype-mock',
        module: 'application-code',
        pattern: /\.prototype\.[a-zA-Z]+\s*=.*jest/,
        category: 'application-code',
        testTypes: [], // Never appropriate
        risk: 'extreme',
        implementation: {
            code: `// ❌ BAD - Don't do this:
// MyClass.prototype.method = jest.fn();

// ✅ GOOD - Use dependency injection instead:
class MyClass {
  constructor(private dependencies: { service: ServiceInterface }) {}
  
  method() {
    return this.dependencies.service.doSomething();
  }
}

// In tests:
const mockService = { doSomething: jest.fn() };
const instance = new MyClass({ service: mockService });`,
            imports: [],
        },
        education: {
            why: 'Modifying prototypes affects global state and can break other tests',
            falsePositiveRisk:
                'Extreme - creates test pollution and unpredictable behavior across test suite',
            whenAppropriate: 'Never - use proper dependency injection or factory patterns',
            alternative: 'Create instances with injected dependencies or use factory functions',
        },
    },

    {
        id: 'application-code.constants-mock',
        module: 'application-code',
        pattern: /jest\.mock\(['"][^'"]*\/(?:constants?|enums?)\/[^'"]*['"]\)/,
        category: 'application-code',
        testTypes: [], // Usually inappropriate
        risk: 'medium',
        implementation: {
            code: `// ❌ BAD - Don't mock constants/enums:
// jest.mock('./constants/api-endpoints');
// jest.mock('../enums/user-roles');

// ✅ GOOD - Use real constants, make them configurable if needed:
import { API_ENDPOINTS } from './constants/api-endpoints';
import { UserRole } from '../enums/user-roles';

// If constants need to vary per test, use dependency injection
class ApiService {
  constructor(private config: { endpoints: typeof API_ENDPOINTS }) {}
  
  async fetchUsers() {
    return fetch(this.config.endpoints.USERS);
  }
}

// In tests:
it('fetches users from correct endpoint', async () => {
  const testEndpoints = { ...API_ENDPOINTS, USERS: '/test/users' };
  const service = new ApiService({ endpoints: testEndpoints });
  
  global.fetch = jest.fn().mockResolvedValue({ ok: true });
  
  await service.fetchUsers();
  
  expect(fetch).toHaveBeenCalledWith('/test/users');
});

// Test enum usage directly:
it('validates user role correctly', () => {
  expect(UserRole.ADMIN).toBe('admin');
  expect(Object.values(UserRole)).toContain('admin');
});`,
            imports: [],
        },
        education: {
            why: 'Constants and enums are static values that should be used as-is in tests',
            falsePositiveRisk: 'Medium - hides issues with constant values or enum usage',
            whenAppropriate: 'Rarely - only when constants have dynamic behavior or side effects',
            alternative:
                'Use real constants - if they need to change per test, they should be parameters',
        },
    },
];
