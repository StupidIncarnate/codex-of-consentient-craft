import { mockFunctionNameContract } from './mock-function-name-contract';
import { MockFunctionNameStub } from './mock-function-name.stub';

describe('mockFunctionNameContract', () => {
  describe('valid names', () => {
    it('VALID: "readFile" => parses successfully', () => {
      const name = MockFunctionNameStub({ value: 'readFile' });

      const result = mockFunctionNameContract.parse(name);

      expect(result).toBe('readFile');
    });

    it('VALID: "mock" => parses successfully', () => {
      const name = MockFunctionNameStub({ value: 'mock' });

      const result = mockFunctionNameContract.parse(name);

      expect(result).toBe('mock');
    });
  });

  describe('invalid names', () => {
    it('INVALID: "" => throws validation error', () => {
      expect(() => {
        return mockFunctionNameContract.parse('');
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: null => throws validation error', () => {
      expect(() => {
        return mockFunctionNameContract.parse(null);
      }).toThrow(/Expected string/u);
    });

    it('INVALID: undefined => throws validation error', () => {
      expect(() => {
        return mockFunctionNameContract.parse(undefined);
      }).toThrow(/Required/u);
    });
  });
});
