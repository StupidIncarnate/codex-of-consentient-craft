import { baseNameContract } from './base-name-contract';
import { BaseNameStub } from './base-name.stub';

describe('baseNameContract', () => {
  describe('valid base names', () => {
    it('VALID: "test-project" => parses successfully', () => {
      const baseName = BaseNameStub({ value: 'test-project' });

      const result = baseNameContract.parse(baseName);

      expect(result).toBe('test-project');
    });

    it('VALID: "my-test" => parses successfully', () => {
      const baseName = BaseNameStub({ value: 'my-test' });

      const result = baseNameContract.parse(baseName);

      expect(result).toBe('my-test');
    });

    it('VALID: "integration-test-env" => parses successfully', () => {
      const baseName = BaseNameStub({ value: 'integration-test-env' });

      const result = baseNameContract.parse(baseName);

      expect(result).toBe('integration-test-env');
    });
  });

  describe('invalid base names', () => {
    it('INVALID_EMPTY: "" => throws validation error', () => {
      expect(() => {
        return baseNameContract.parse('');
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID_TYPE: null => throws validation error', () => {
      expect(() => {
        return baseNameContract.parse(null);
      }).toThrow(/Expected string/u);
    });

    it('INVALID_TYPE: undefined => throws validation error', () => {
      expect(() => {
        return baseNameContract.parse(undefined);
      }).toThrow(/Required/u);
    });
  });
});
