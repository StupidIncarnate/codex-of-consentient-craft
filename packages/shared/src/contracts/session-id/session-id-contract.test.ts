import { sessionIdContract } from './session-id-contract';
import { SessionIdStub } from './session-id.stub';

describe('sessionIdContract', () => {
  describe('valid session IDs', () => {
    it('VALID: {value: "9c4d8f1c-3e38-48c9-bdec-22b61883b473"} => parses UUID session ID', () => {
      const result = sessionIdContract.parse('9c4d8f1c-3e38-48c9-bdec-22b61883b473');

      expect(result).toBe('9c4d8f1c-3e38-48c9-bdec-22b61883b473');
    });

    it('VALID: {value: "abc-123"} => parses non-UUID session ID', () => {
      const result = sessionIdContract.parse('abc-123');

      expect(result).toBe('abc-123');
    });

    it('VALID: {value: "session_12345"} => parses underscore format', () => {
      const result = sessionIdContract.parse('session_12345');

      expect(result).toBe('session_12345');
    });

    it('VALID: {value: "a"} => parses single character session ID', () => {
      const result = sessionIdContract.parse('a');

      expect(result).toBe('a');
    });
  });

  describe('invalid session IDs', () => {
    it('INVALID_VALUE: {value: ""} => throws for empty string', () => {
      expect(() => sessionIdContract.parse('')).toThrow(/too_small/u);
    });

    it('INVALID_VALUE: {value: null} => throws for null', () => {
      expect(() => sessionIdContract.parse(null as never)).toThrow(/invalid_type/u);
    });

    it('INVALID_VALUE: {value: undefined} => throws for undefined', () => {
      expect(() => sessionIdContract.parse(undefined as never)).toThrow(/invalid_type/u);
    });

    it('INVALID_VALUE: {value: 123} => throws for number', () => {
      expect(() => sessionIdContract.parse(123 as never)).toThrow(/invalid_type/u);
    });
  });

  describe('stub', () => {
    it('VALID: stub default => returns default session ID', () => {
      const sessionId = SessionIdStub();

      expect(sessionId).toBe('9c4d8f1c-3e38-48c9-bdec-22b61883b473');
    });

    it('VALID: stub with custom value => returns custom session ID', () => {
      const sessionId = SessionIdStub({ value: 'custom-session-id' });

      expect(sessionId).toBe('custom-session-id');
    });
  });
});
