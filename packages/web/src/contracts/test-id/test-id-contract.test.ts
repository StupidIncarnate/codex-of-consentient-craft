import { testIdContract } from './test-id-contract';
import { TestIdStub } from './test-id.stub';

describe('testIdContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "CHAT_MESSAGES_AREA"} => parses test id', () => {
      const result = testIdContract.parse('CHAT_MESSAGES_AREA');

      expect(result).toBe('CHAT_MESSAGES_AREA');
    });

    it('VALID: {value: ""} => parses empty string', () => {
      const result = testIdContract.parse('');

      expect(result).toBe('');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: 123} => throws for number', () => {
      expect(() => testIdContract.parse(123)).toThrow(/Expected string/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid test id', () => {
      const result = TestIdStub();

      expect(result).toBe('test-id');
    });

    it('VALID: {value: "custom"} => creates with custom value', () => {
      const result = TestIdStub({ value: 'custom' });

      expect(result).toBe('custom');
    });
  });
});
