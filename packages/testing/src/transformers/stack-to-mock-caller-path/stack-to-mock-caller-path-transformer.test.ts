import { stackToMockCallerPathTransformer } from './stack-to-mock-caller-path-transformer';

describe('stackToMockCallerPathTransformer', () => {
  describe('proxy file detection', () => {
    it('VALID: {stack with .proxy.ts at frameOffset} => returns adapter basename', () => {
      const stack = [
        'Error',
        '    at deriveCallerPath (/src/adapters/jest/register-mock/jest-register-mock-adapter.ts:38:17)',
        '    at jestRegisterMockAdapter (/src/adapters/jest/register-mock/jest-register-mock-adapter.ts:100:20)',
        '    at Object.<anonymous> (/src/adapters/child-process/exec-file/child-process-exec-file-adapter.proxy.ts:10:5)',
      ].join('\n');

      const result = stackToMockCallerPathTransformer({ stack, frameOffset: 3 });

      expect(result).toBe('child-process-exec-file-adapter');
    });

    it('VALID: {stack with .proxy.js at frameOffset} => returns adapter basename', () => {
      const stack = [
        'Error',
        '    at deriveCallerPath (/dist/adapters/jest/register-mock/jest-register-mock-adapter.js:30:17)',
        '    at jestRegisterMockAdapter (/dist/adapters/jest/register-mock/jest-register-mock-adapter.js:80:20)',
        '    at Object.<anonymous> (/dist/adapters/fs/read-file/fs-read-file-adapter.proxy.js:8:5)',
      ].join('\n');

      const result = stackToMockCallerPathTransformer({ stack, frameOffset: 3 });

      expect(result).toBe('fs-read-file-adapter');
    });
  });

  describe('test file detection', () => {
    it('VALID: {stack with .test.ts at frameOffset} => returns base name without .test', () => {
      const stack = [
        'Error',
        '    at fn1 (/src/file1.ts:1:1)',
        '    at fn2 (/src/file2.ts:1:1)',
        '    at Object.<anonymous> (/src/adapters/jest/register-mock/jest-register-mock-adapter.test.ts:15:5)',
      ].join('\n');

      const result = stackToMockCallerPathTransformer({ stack, frameOffset: 3 });

      expect(result).toBe('jest-register-mock-adapter');
    });
  });

  describe('fallback detection', () => {
    it('VALID: {stack with plain .ts file at frameOffset} => returns filename without extension', () => {
      const stack = [
        'Error',
        '    at fn1 (/src/file1.ts:1:1)',
        '    at fn2 (/src/file2.ts:1:1)',
        '    at Object.<anonymous> (/src/adapters/some-adapter.ts:15:5)',
      ].join('\n');

      const result = stackToMockCallerPathTransformer({ stack, frameOffset: 3 });

      expect(result).toBe('some-adapter');
    });

    it('EMPTY: {stack with no matching frames} => returns empty string', () => {
      const stack = [
        'Error',
        '    at fn1 (native)',
        '    at fn2 (native)',
        '    at fn3 (native)',
      ].join('\n');

      const result = stackToMockCallerPathTransformer({ stack, frameOffset: 3 });

      expect(result).toBe('');
    });
  });

  describe('frame scanning', () => {
    it('VALID: {proxy file beyond frameOffset} => scans forward to find it', () => {
      const stack = [
        'Error',
        '    at fn1 (native)',
        '    at fn2 (native)',
        '    at fn3 (native)',
        '    at fn4 (native)',
        '    at Object.<anonymous> (/src/adapters/fs/write-file/fs-write-file-adapter.proxy.ts:5:3)',
      ].join('\n');

      const result = stackToMockCallerPathTransformer({ stack, frameOffset: 3 });

      expect(result).toBe('fs-write-file-adapter');
    });
  });
});
