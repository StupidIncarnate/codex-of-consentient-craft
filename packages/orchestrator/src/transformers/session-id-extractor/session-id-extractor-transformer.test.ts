import { snakeKeysToCamelKeysTransformer } from '@dungeonmaster/shared/transformers';

import { sessionIdExtractorTransformer } from './session-id-extractor-transformer';

describe('sessionIdExtractorTransformer', () => {
  describe('valid session ID extraction', () => {
    it('VALID: {parsed with sessionId} => returns SessionId', () => {
      const result = sessionIdExtractorTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse(
            '{"type":"system","subtype":"init","session_id":"9c4d8f1c-3e38-48c9-bdec-22b61883b473"}',
          ),
        }),
      });

      expect(result).toBe('9c4d8f1c-3e38-48c9-bdec-22b61883b473');
    });

    it('VALID: {parsed with only sessionId} => returns SessionId', () => {
      const result = sessionIdExtractorTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse('{"session_id":"abc-123"}'),
        }),
      });

      expect(result).toBe('abc-123');
    });

    it('VALID: {assistant message with sessionId} => returns SessionId', () => {
      const result = sessionIdExtractorTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse(
            '{"type":"assistant","session_id":"test-session-456","message":{"content":"Hello"}}',
          ),
        }),
      });

      expect(result).toBe('test-session-456');
    });
  });

  describe('no session ID found', () => {
    it('EMPTY: {parsed without sessionId} => returns null', () => {
      const result = sessionIdExtractorTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse('{"type":"system","message":"Hello"}'),
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {empty parsed object} => returns null', () => {
      const result = sessionIdExtractorTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse('{}'),
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {sessionId is not a string} => returns null', () => {
      const result = sessionIdExtractorTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse('{"session_id":12345}'),
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {sessionId is null} => returns null', () => {
      const result = sessionIdExtractorTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse('{"session_id":null}'),
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {sessionId is empty string} => returns null', () => {
      const result = sessionIdExtractorTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse('{"session_id":""}'),
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {parsed string literal} => returns null', () => {
      const result = sessionIdExtractorTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse('"just a string"'),
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {parsed number literal} => returns null', () => {
      const result = sessionIdExtractorTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse('12345'),
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {parsed boolean literal} => returns null', () => {
      const result = sessionIdExtractorTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse('true'),
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {parsed null literal} => returns null', () => {
      const result = sessionIdExtractorTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse('null'),
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {parsed array} => returns null', () => {
      const result = sessionIdExtractorTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse('["session_id", "abc-123"]'),
        }),
      });

      expect(result).toBe(null);
    });
  });

  describe('hook event filtering', () => {
    it('EDGE: {subtype: hook_started with sessionId} => returns null', () => {
      const result = sessionIdExtractorTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse('{"subtype":"hook_started","session_id":"hook-session-abc"}'),
        }),
      });

      expect(result).toBe(null);
    });

    it('EDGE: {subtype: hook_response with sessionId} => returns null', () => {
      const result = sessionIdExtractorTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse('{"subtype":"hook_response","session_id":"hook-session-def"}'),
        }),
      });

      expect(result).toBe(null);
    });

    it('VALID: {subtype: other with sessionId} => returns SessionId', () => {
      const result = sessionIdExtractorTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse('{"subtype":"init","session_id":"real-session-789"}'),
        }),
      });

      expect(result).toBe('real-session-789');
    });
  });

  describe('invalid JSON handling', () => {
    it('ERROR: {parsed null from invalid JSON upstream} => returns null', () => {
      const result = sessionIdExtractorTransformer({ parsed: null });

      expect(result).toBe(null);
    });

    it('ERROR: {parsed null from truncated JSON upstream} => returns null', () => {
      const result = sessionIdExtractorTransformer({ parsed: null });

      expect(result).toBe(null);
    });
  });
});
