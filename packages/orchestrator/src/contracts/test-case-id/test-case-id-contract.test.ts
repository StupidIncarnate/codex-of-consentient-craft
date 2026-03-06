import { testCaseIdContract } from './test-case-id-contract';
import { TestCaseIdStub } from './test-case-id.stub';

describe('testCaseIdContract', () => {
  describe('valid IDs', () => {
    it('VALID: {value: uuid} => parses successfully', () => {
      const id = TestCaseIdStub();

      const result = testCaseIdContract.parse(id);

      expect(result).toBe('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d');
    });

    it('VALID: {value: custom uuid} => parses successfully', () => {
      const id = TestCaseIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      const result = testCaseIdContract.parse(id);

      expect(result).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });
  });

  describe('invalid IDs', () => {
    it('INVALID_ID: {value: "not-a-uuid"} => throws validation error', () => {
      expect(() => {
        return testCaseIdContract.parse('not-a-uuid');
      }).toThrow(/Invalid uuid/u);
    });

    it('INVALID_ID: {value: ""} => throws validation error', () => {
      expect(() => {
        return testCaseIdContract.parse('');
      }).toThrow(/Invalid uuid/u);
    });
  });
});
