import { stackToMockHandleMatchTransformer } from './stack-to-mock-handle-match-transformer';
import { MockHandleEntryStub } from '../../contracts/mock-handle-entry/mock-handle-entry.stub';
import { MockCallerPathStub } from '../../contracts/mock-caller-path/mock-caller-path.stub';

describe('stackToMockHandleMatchTransformer', () => {
  describe('match found', () => {
    it('VALID: {stack containing callerPath} => returns matching handle', () => {
      const handle = MockHandleEntryStub({
        callerPath: MockCallerPathStub({ value: 'fs-read-file-adapter' }),
      });
      const stack = [
        'Error',
        '    at dispatcher (/src/adapters/jest/register-mock/jest-register-mock-adapter.ts:130:5)',
        '    at Object.<anonymous> (/src/adapters/fs/read-file/fs-read-file-adapter.ts:25:10)',
      ].join('\n');

      const result = stackToMockHandleMatchTransformer({ stack, handles: [handle] });

      expect(result).toBe(handle);
    });

    it('VALID: {stack with multiple handles} => returns first matching handle by stack order', () => {
      const handleA = MockHandleEntryStub({
        callerPath: MockCallerPathStub({ value: 'adapter-a' }),
      });
      const handleB = MockHandleEntryStub({
        callerPath: MockCallerPathStub({ value: 'adapter-b' }),
      });
      const stack = [
        'Error',
        '    at dispatcher (/src/register-mock.ts:130:5)',
        '    at Object.<anonymous> (/src/adapter-b.ts:10:5)',
        '    at Object.<anonymous> (/src/adapter-a.ts:20:5)',
      ].join('\n');

      const result = stackToMockHandleMatchTransformer({ stack, handles: [handleA, handleB] });

      expect(result).toBe(handleB);
    });
  });

  describe('no match', () => {
    it('EMPTY: {stack with no matching callerPath} => returns undefined', () => {
      const handle = MockHandleEntryStub({
        callerPath: MockCallerPathStub({ value: 'fs-read-file-adapter' }),
      });
      const stack = [
        'Error',
        '    at dispatcher (/src/register-mock.ts:130:5)',
        '    at Object.<anonymous> (/src/unrelated-file.ts:10:5)',
      ].join('\n');

      const result = stackToMockHandleMatchTransformer({ stack, handles: [handle] });

      expect(result).toBeUndefined();
    });

    it('EMPTY: {empty handles array} => returns undefined', () => {
      const stack = ['Error', '    at Object.<anonymous> (/src/some-file.ts:10:5)'].join('\n');

      const result = stackToMockHandleMatchTransformer({ stack, handles: [] });

      expect(result).toBeUndefined();
    });
  });

  describe('catch-all exclusion', () => {
    it('VALID: {handle with empty callerPath} => skips empty callerPath handles', () => {
      const catchAllHandle = MockHandleEntryStub({
        callerPath: MockCallerPathStub({ value: '' }),
      });
      const stack = ['Error', '    at Object.<anonymous> (/src/some-file.ts:10:5)'].join('\n');

      const result = stackToMockHandleMatchTransformer({ stack, handles: [catchAllHandle] });

      expect(result).toBeUndefined();
    });
  });
});
