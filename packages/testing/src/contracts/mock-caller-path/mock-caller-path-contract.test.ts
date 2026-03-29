import { mockCallerPathContract } from './mock-caller-path-contract';
import { MockCallerPathStub } from './mock-caller-path.stub';

describe('mockCallerPathContract', () => {
  describe('valid caller paths', () => {
    it('VALID: "child-process-exec-file-adapter" => parses successfully', () => {
      const callerPath = MockCallerPathStub({ value: 'child-process-exec-file-adapter' });

      const result = mockCallerPathContract.parse(callerPath);

      expect(result).toBe('child-process-exec-file-adapter');
    });

    it('VALID: "fs-read-file-adapter" => parses successfully', () => {
      const callerPath = MockCallerPathStub({ value: 'fs-read-file-adapter' });

      const result = mockCallerPathContract.parse(callerPath);

      expect(result).toBe('fs-read-file-adapter');
    });

    it('VALID: "" => parses empty string for catch-all handles', () => {
      const callerPath = MockCallerPathStub({ value: '' });

      const result = mockCallerPathContract.parse(callerPath);

      expect(result).toBe('');
    });
  });

  describe('invalid caller paths', () => {
    it('INVALID: null => throws validation error', () => {
      expect(() => {
        return mockCallerPathContract.parse(null);
      }).toThrow(/Expected string/u);
    });

    it('INVALID: undefined => throws validation error', () => {
      expect(() => {
        return mockCallerPathContract.parse(undefined);
      }).toThrow(/Required/u);
    });
  });
});
