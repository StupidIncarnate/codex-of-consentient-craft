import type { MockPattern } from '../types';

export const CHILD_PROCESS_PATTERNS: MockPattern[] = [
  {
    id: 'child_process.full-mock',
    module: 'child_process',
    pattern: /jest\.mock\(['"]child_process['"]\)/,
    category: 'system-boundary',
    testTypes: [], // Never appropriate
    risk: 'extreme',
    implementation: {
      code: `// ❌ BAD - Don't mock entire child_process module:
// jest.mock('child_process');

// ✅ GOOD - Use realistic EventEmitter mock for spawn:
import * as child_process from 'child_process';
import { EventEmitter } from 'events';
import { PassThrough, Writable } from 'stream';

const mockChild = new EventEmitter() as ChildProcess;
mockChild.stdout = new PassThrough();
mockChild.stderr = new PassThrough();
mockChild.stdin = new Writable({
  write: (chunk, encoding, callback) => callback()
});

jest.spyOn(child_process, 'spawn').mockReturnValue(mockChild);

// In your test, simulate realistic process behavior:
it('handles process output correctly', () => {
  // Trigger the process events
  mockChild.stdout.write('process output');
  mockChild.emit('close', 0);
  
  // Test your actual code behavior
  expect(yourFunctionThatUsesSpawn()).toStrictEqual(expectedResult);
});`,
      imports: [
        'import * as child_process from "child_process"',
        'import { EventEmitter } from "events"',
        'import { PassThrough, Writable } from "stream"',
        'import type { ChildProcess } from "child_process"',
      ],
    },
    education: {
      why: 'Completely replaces all child_process functionality with empty mocks',
      falsePositiveRisk:
        'Extreme - test passes even if spawn is called with completely wrong commands, arguments, or not called at all',
      whenAppropriate: 'Never - eliminates all integration testing value',
      alternative: 'child_process.spawn.event-emitter',
    },
  },

  {
    id: 'child_process.spawn.simple-mock',
    module: 'child_process',
    pattern:
      /jest\.spyOn\([^)]*child_process[^)]*,\s*['"]spawn['"]\)\s*\.mockReturnValue\s*\(\s*{[^}]*}\s*\)/,
    category: 'system-boundary',
    testTypes: [], // Never appropriate - too simplistic
    risk: 'high',
    implementation: {
      code: `// ❌ BAD - Don't use simple object for spawn mock:
// jest.spyOn(child_process, 'spawn').mockReturnValue({
//   stdout: 'fake output',
//   stderr: '',
//   code: 0
// });

// ✅ GOOD - Use EventEmitter with streams for realistic behavior:
import * as child_process from 'child_process';
import { EventEmitter } from 'events';
import { PassThrough, Writable } from 'stream';

const mockChild = new EventEmitter() as ChildProcess;
mockChild.stdout = new PassThrough();
mockChild.stderr = new PassThrough();
mockChild.stdin = new Writable({
  write: (chunk, encoding, callback) => callback()
});

jest.spyOn(child_process, 'spawn').mockReturnValue(mockChild);

// Test the real process interaction:
it('processes spawn output correctly', async () => {
  // Your code calls spawn
  const promise = yourFunctionThatCallsSpawn('npm', ['test']);
  
  // Simulate realistic process events
  mockChild.stdout.write('test output\\n');
  mockChild.stderr.write('');
  mockChild.emit('close', 0);
  
  const result = await promise;
  expect(result).toStrictEqual({ 
    output: 'test output\\n', 
    exitCode: 0 
  });
});`,
      imports: [
        'import * as child_process from "child_process"',
        'import { EventEmitter } from "events"',
        'import { PassThrough, Writable } from "stream"',
        'import type { ChildProcess } from "child_process"',
      ],
    },
    education: {
      why: 'Mocks spawn with a simple object instead of realistic process behavior',
      falsePositiveRisk:
        'High - misses all EventEmitter behavior, stream handling, and async process lifecycle',
      whenAppropriate: 'Never - child processes are EventEmitters with streams, not simple objects',
      alternative: 'child_process.spawn.event-emitter',
    },
  },

  {
    id: 'child_process.spawn.event-emitter',
    module: 'child_process',
    pattern:
      /jest\.spyOn\([^)]*child_process[^)]*,\s*['"]spawn['"]\)[^}]+EventEmitter[^}]+mockReturnValue/s,
    category: 'system-boundary',
    testTypes: ['unit'],
    risk: 'low',
    implementation: {
      code: `const mockChild = new EventEmitter() as ChildProcess;
mockChild.stdout = new PassThrough();
mockChild.stderr = new PassThrough();  
mockChild.stdin = new Writable({
  write: (chunk, encoding, callback) => callback()
});

jest.spyOn(child_process, 'spawn').mockReturnValue(mockChild);

// In your test, simulate process behavior:
// mockChild.stdout.write('output');
// mockChild.emit('close', 0);`,
      imports: [
        'import { EventEmitter } from "events"',
        'import { PassThrough, Writable } from "stream"',
        'import * as child_process from "child_process"',
        'import type { ChildProcess } from "child_process"',
      ],
      setup: `let mockChild: ChildProcess & EventEmitter;

beforeEach(() => {
  mockChild = new EventEmitter() as ChildProcess;
  mockChild.stdout = new PassThrough();
  mockChild.stderr = new PassThrough();
  mockChild.stdin = new Writable({
    write: (chunk, encoding, callback) => callback()
  });
  
  jest.spyOn(child_process, 'spawn').mockReturnValue(mockChild);
});`,
    },
    education: {
      why: 'Provides realistic child process behavior with proper EventEmitter and stream interfaces',
      falsePositiveRisk:
        'Low - still validates spawn arguments, stream handling, and event sequencing',
      whenAppropriate:
        'Unit tests that need to verify child process interaction logic without spawning real processes',
    },
  },

  {
    id: 'child_process.spawn.controlled-executable',
    module: 'child_process',
    pattern: /spawn\(['"]node['"].*test-fixtures/,
    category: 'system-boundary',
    testTypes: ['integration'],
    risk: 'none',
    implementation: {
      code: `// No mocking - use real spawn with controlled test script
const result = await processUtils.spawn('node', [
  'test-fixtures/mock-eslint.js',
  '--stdin'
], { stdin: testContent });`,
      imports: [],
      setup: `// Create test-fixtures/mock-eslint.js:
// process.stdout.write(JSON.stringify([{messages: []}]));
// process.exit(0);`,
    },
    education: {
      why: 'Tests real process spawning with a controlled executable that simulates the target tool',
      falsePositiveRisk:
        'None - exercises the complete process lifecycle including argument passing, streams, and exit codes',
      whenAppropriate:
        'Integration tests that need to verify real process interaction without depending on external tools',
    },
  },

  {
    id: 'child_process.spawn.real-tool',
    module: 'child_process',
    pattern: /spawn\(['"](?:npm|npx|eslint|tsc|node)['"],\s*[^)]*/,
    category: 'system-boundary',
    testTypes: ['e2e'],
    risk: 'none',
    implementation: {
      code: `// No mocking - spawn actual tool with controlled input
const result = await processUtils.spawn('npm', [
  'run', 'lint', '--', 
  '--stdin', 
  '--stdin-filename', filePath
], { stdin: testContent });`,
      imports: [],
      setup: `// Ensure test environment has required tools installed
// Consider using test timeouts and cleanup`,
    },
    education: {
      why: 'Tests against the actual external tool to verify real-world integration',
      falsePositiveRisk: 'None - this is reality, any failures represent actual problems',
      whenAppropriate: 'E2E/smoke tests that verify integration with actual external tools',
    },
  },

  {
    id: 'child_process.exec.mock',
    module: 'child_process',
    pattern: /jest\.spyOn\([^)]*child_process[^)]*,\s*['"]exec['"]\)/,
    category: 'system-boundary',
    testTypes: ['unit'],
    risk: 'medium',
    implementation: {
      code: `jest.spyOn(child_process, 'exec').mockImplementation((command, callback) => {
  if (typeof callback === 'function') {
    process.nextTick(() => callback(null, 'mocked output', ''));
  }
  return {} as ChildProcess;
});`,
      imports: [
        'import * as child_process from "child_process"',
        'import type { ChildProcess } from "child_process"',
      ],
    },
    education: {
      why: 'Mocks exec to avoid shell command execution during testing',
      falsePositiveRisk: 'Medium - validates command string but not actual execution behavior',
      whenAppropriate: 'Unit tests for code that uses exec() for simple command execution',
      alternative: 'child_process.spawn.event-emitter', // Prefer spawn over exec
    },
  },
];
