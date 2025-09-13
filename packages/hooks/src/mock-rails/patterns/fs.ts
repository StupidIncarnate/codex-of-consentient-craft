import type { MockPattern } from '../types';

export const FS_PATTERNS: MockPattern[] = [
  {
    id: 'fs.full-mock',
    module: 'fs',
    pattern: /jest\.mock\(['"]fs['"]\)/,
    category: 'system-boundary',
    testTypes: [], // Never appropriate
    risk: 'extreme',
    implementation: {
      code: `// ❌ BAD - Don't mock entire fs module:
// jest.mock('fs');

// ✅ GOOD - Mock specific methods you need:
import * as fs from 'fs/promises';

jest.spyOn(fs, 'readFile').mockResolvedValue('test file content');
jest.spyOn(fs, 'writeFile').mockResolvedValue();

// Test your actual file processing logic
it('processes file correctly', async () => {
  const result = await processConfigFile('config.json');
  
  expect(fs.readFile).toHaveBeenCalledWith('config.json', 'utf8');
  expect(result).toStrictEqual({ processed: 'test file content' });
});`,
      imports: ['import * as fs from "fs/promises"'],
    },
    education: {
      why: 'Completely replaces all filesystem functionality with empty mocks',
      falsePositiveRisk:
        'Extreme - test passes even if wrong methods are called or file paths are incorrect',
      whenAppropriate: 'Never - eliminates all integration testing value',
      alternative: 'fs.promises.selective-mock',
    },
  },

  {
    id: 'fs.promises.full-mock',
    module: 'fs/promises',
    pattern: /jest\.mock\(['"]fs\/promises['"]\)/,
    category: 'system-boundary',
    testTypes: [], // Never appropriate
    risk: 'extreme',
    implementation: {
      code: `// ❌ BAD - Don't mock entire fs/promises module:
// jest.mock('fs/promises');

// ✅ GOOD - Mock specific async methods:
import * as fs from 'fs/promises';

jest.spyOn(fs, 'readFile').mockResolvedValue('{"key": "value"}');
jest.spyOn(fs, 'writeFile').mockResolvedValue();
jest.spyOn(fs, 'stat').mockResolvedValue({
  isFile: () => true,
  isDirectory: () => false,
  size: 1024,
  mtime: new Date('2024-01-01'),
} as any);

// Test your async file operations
it('loads and parses JSON config', async () => {
  const config = await loadJsonConfig('app.config.json');
  
  expect(fs.readFile).toHaveBeenCalledWith('app.config.json', 'utf8');
  expect(config).toStrictEqual({ key: 'value' });
});`,
      imports: ['import * as fs from "fs/promises"'],
    },
    education: {
      why: 'Completely replaces all async filesystem functionality with empty mocks',
      falsePositiveRisk:
        'Extreme - test passes even if wrong methods are called or file paths are incorrect',
      whenAppropriate: 'Never - eliminates all integration testing value',
      alternative: 'fs.promises.selective-mock',
    },
  },

  {
    id: 'fs.promises.selective-mock',
    module: 'fs/promises',
    pattern: /jest\.spyOn\([^)]*fs[^)]*,\s*['"](?:readFile|writeFile|access|stat|mkdir)['"]\)/,
    category: 'system-boundary',
    testTypes: ['unit'],
    risk: 'low',
    implementation: {
      code: `// ✅ GOOD - Mock specific filesystem methods for unit testing:
import * as fs from 'fs/promises';

beforeEach(() => {
  jest.spyOn(fs, 'readFile').mockResolvedValue('test config content');
  jest.spyOn(fs, 'writeFile').mockResolvedValue();
  jest.spyOn(fs, 'stat').mockResolvedValue({
    isFile: () => true,
    isDirectory: () => false,
    size: 256,
    mtime: new Date('2024-01-01'),
  } as any);
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Test your file processing logic
it('processes configuration file', async () => {
  const processor = new ConfigProcessor();
  const result = await processor.loadConfig('app.config.json');
  
  expect(fs.readFile).toHaveBeenCalledWith('app.config.json', 'utf8');
  expect(fs.stat).toHaveBeenCalledWith('app.config.json');
  expect(result).toStrictEqual({
    content: 'test config content',
    size: 256,
    lastModified: new Date('2024-01-01'),
  });
});`,
      imports: ['import * as fs from "fs/promises"'],
      setup: `beforeEach(() => {
  // Reset all fs mocks
  jest.restoreAllMocks();
});`,
    },
    education: {
      why: 'Mocks specific filesystem operations while preserving the async interface',
      falsePositiveRisk: 'Low - still validates which methods are called and with what arguments',
      whenAppropriate:
        'Unit tests that need to verify filesystem operations without touching the actual filesystem',
    },
  },

  {
    id: 'fs.sync.selective-mock',
    module: 'fs',
    pattern:
      /jest\.spyOn\([^)]*fs[^)]*,\s*['"](?:readFileSync|writeFileSync|existsSync|statSync|mkdirSync)['"]\)/,
    category: 'system-boundary',
    testTypes: ['unit'],
    risk: 'low',
    implementation: {
      code: `// ✅ GOOD - Mock specific sync filesystem methods (prefer async when possible):
import * as fs from 'fs';

beforeEach(() => {
  jest.spyOn(fs, 'readFileSync').mockReturnValue('mock sync content');
  jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
  jest.spyOn(fs, 'existsSync').mockReturnValue(true);
  jest.spyOn(fs, 'statSync').mockReturnValue({
    isFile: () => true,
    isDirectory: () => false,
    size: 512,
    mtime: new Date('2024-01-01'),
  } as any);
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Test synchronous file operations
it('loads config synchronously', () => {
  const config = loadConfigSync('sync-config.json');
  
  expect(fs.readFileSync).toHaveBeenCalledWith('sync-config.json', 'utf8');
  expect(fs.existsSync).toHaveBeenCalledWith('sync-config.json');
  expect(config).toBe('mock sync content');
});`,
      imports: ['import * as fs from "fs"'],
      setup: `beforeEach(() => {
  // Reset all fs mocks
  jest.restoreAllMocks();
});`,
    },
    education: {
      why: 'Mocks specific synchronous filesystem operations',
      falsePositiveRisk: 'Low - still validates which methods are called and with what arguments',
      whenAppropriate: 'Unit tests for code using synchronous filesystem operations',
      alternative: 'fs.promises.selective-mock', // Prefer async
    },
  },

  {
    id: 'fs.memfs',
    module: 'fs',
    pattern: /createFsFromVolume|Volume\.fromJSON|memfs/,
    category: 'system-boundary',
    testTypes: ['integration'],
    risk: 'none',
    implementation: {
      code: `import { createFsFromVolume, Volume } from 'memfs';

const vol = Volume.fromJSON({
  '/test/file.txt': 'test content',
  '/test/dir/nested.txt': 'nested content'
});

// Replace fs with in-memory filesystem
jest.doMock('fs', () => createFsFromVolume(vol));
jest.doMock('fs/promises', () => createFsFromVolume(vol).promises);`,
      imports: ['import { createFsFromVolume, Volume } from "memfs"'],
      setup: `// Install memfs: npm install --save-dev memfs
let vol: Volume;

beforeEach(() => {
  vol = Volume.fromJSON({
    '/test/input.txt': 'test input',
    '/test/config.json': '{"setting": "value"}'
  });
  
  jest.doMock('fs', () => createFsFromVolume(vol));
  jest.doMock('fs/promises', () => createFsFromVolume(vol).promises);
});`,
    },
    education: {
      why: 'Provides a realistic filesystem implementation in memory for testing',
      falsePositiveRisk: 'None - exercises real filesystem APIs with actual file operations',
      whenAppropriate:
        'Integration tests that need realistic filesystem behavior without touching the real filesystem',
    },
  },

  {
    id: 'fs.temp-directory',
    module: 'fs',
    pattern: /tmp|tmpdir|mkdtemp/,
    category: 'system-boundary',
    testTypes: ['integration', 'e2e'],
    risk: 'none',
    implementation: {
      code: `import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Use real filesystem with temporary directory
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));

// Create test files
await fs.writeFile(path.join(tempDir, 'test.txt'), 'test content');

// Your test code here...

// Cleanup
await fs.rm(tempDir, { recursive: true });`,
      imports: [
        'import * as fs from "fs/promises"',
        'import * as path from "path"',
        'import * as os from "os"',
      ],
      setup: `let tempDir: string;

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));
});

afterEach(async () => {
  if (tempDir) {
    await fs.rm(tempDir, { recursive: true });
  }
});`,
    },
    education: {
      why: 'Uses the real filesystem with temporary directories for testing',
      falsePositiveRisk: 'None - exercises the complete filesystem API with real file operations',
      whenAppropriate:
        'Integration/E2E tests that need to verify filesystem behavior with actual files',
    },
  },

  {
    id: 'fs.node-test-helpers',
    module: 'fs',
    pattern: /test\.tmpdir|test\.fixturePath/,
    category: 'system-boundary',
    testTypes: ['unit', 'integration'],
    risk: 'none',
    implementation: {
      code: `import test from 'node:test';

// Use Node.js test helpers (Node 18+)
const tmpDir = test.tmpdir();
const fixturePath = test.fixturePath('test-file.txt');

// Work with real files in test-specific directories
await fs.writeFile(path.join(tmpDir, 'output.txt'), 'test data');`,
      imports: [
        'import test from "node:test"',
        'import * as fs from "fs/promises"',
        'import * as path from "path"',
      ],
    },
    education: {
      why: 'Leverages Node.js built-in test utilities for filesystem testing',
      falsePositiveRisk: 'None - uses real filesystem with automatic cleanup',
      whenAppropriate: 'Tests using Node.js test runner that need filesystem operations',
    },
  },
];
