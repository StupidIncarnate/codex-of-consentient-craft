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
      }).toThrow(/expected string to have >=1 characters/u);
    });

    it('INVALID: null => throws validation error', () => {
      expect(() => {
        return mockFunctionNameContract.parse(null);
      }).toThrow(/expected string/u);
    });

    it('INVALID: undefined => throws validation error', () => {
      expect(() => {
        return mockFunctionNameContract.parse(undefined);
      }).toThrow(/received undefined/u);
    });
  });
});
