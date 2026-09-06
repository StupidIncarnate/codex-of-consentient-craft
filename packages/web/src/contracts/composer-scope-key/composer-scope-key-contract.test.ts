import { composerScopeKeyContract } from './composer-scope-key-contract';
import { ComposerScopeKeyStub } from './composer-scope-key.stub';

describe('composerScopeKeyContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "f47ac10b-58cc-4372-a567-0e02b2c3d479"} => parses the quest id as a scope key', () => {
      const result = composerScopeKeyContract.parse('f47ac10b-58cc-4372-a567-0e02b2c3d479');

      expect(result).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('VALID: {value: "create"} => parses the create-surface sentinel', () => {
      const result = composerScopeKeyContract.parse('create');

      expect(result).toBe('create');
    });

    it('VALID: {value: "f47ac10b-58cc-4372-a567-0e02b2c3d479:followup"} => parses a follow-up scope key', () => {
      const result = composerScopeKeyContract.parse(
        'f47ac10b-58cc-4372-a567-0e02b2c3d479:followup',
      );

      expect(result).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479:followup');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: ""} => throws for empty string', () => {
      expect(() => composerScopeKeyContract.parse('')).toThrow(/String must contain at least 1/u);
    });

    it('INVALID: {value: 123} => throws for number', () => {
      expect(() => composerScopeKeyContract.parse(123 as never)).toThrow(/Expected string/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates a valid scope key', () => {
      const result = ComposerScopeKeyStub();

      expect(result).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('VALID: {value: "create"} => creates with a custom value', () => {
      const result = ComposerScopeKeyStub({ value: 'create' });

      expect(result).toBe('create');
    });
  });
});
