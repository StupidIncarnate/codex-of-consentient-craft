import { sessionIdExtractorTransformer } from './session-id-extractor-transformer';
import { StreamJsonLineStub } from '../../contracts/stream-json-line/stream-json-line.stub';

describe('sessionIdExtractorTransformer', () => {
  describe('valid session ID extraction', () => {
    it('VALID: {line with session_id} => returns SessionId', () => {
      const line = StreamJsonLineStub({
        value:
          '{"type":"system","subtype":"init","session_id":"9c4d8f1c-3e38-48c9-bdec-22b61883b473"}',
      });

      const result = sessionIdExtractorTransformer({ line });

      expect(result).toBe('9c4d8f1c-3e38-48c9-bdec-22b61883b473');
    });

    it('VALID: {line with only session_id} => returns SessionId', () => {
      const line = StreamJsonLineStub({
        value: '{"session_id":"abc-123"}',
      });

      const result = sessionIdExtractorTransformer({ line });

      expect(result).toBe('abc-123');
    });

    it('VALID: {assistant message with session_id} => returns SessionId', () => {
      const line = StreamJsonLineStub({
        value: '{"type":"assistant","session_id":"test-session-456","message":{"content":"Hello"}}',
      });

      const result = sessionIdExtractorTransformer({ line });

      expect(result).toBe('test-session-456');
    });
  });

  describe('no session ID found', () => {
    it('EMPTY: {line without session_id} => returns null', () => {
      const line = StreamJsonLineStub({
        value: '{"type":"system","message":"Hello"}',
      });

      const result = sessionIdExtractorTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {empty JSON object} => returns null', () => {
      const line = StreamJsonLineStub({
        value: '{}',
      });

      const result = sessionIdExtractorTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {session_id is not a string} => returns null', () => {
      const line = StreamJsonLineStub({
        value: '{"session_id":12345}',
      });

      const result = sessionIdExtractorTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {session_id is null} => returns null', () => {
      const line = StreamJsonLineStub({
        value: '{"session_id":null}',
      });

      const result = sessionIdExtractorTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {session_id is empty string} => returns null', () => {
      const line = StreamJsonLineStub({
        value: '{"session_id":""}',
      });

      const result = sessionIdExtractorTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {JSON string literal} => returns null', () => {
      const line = StreamJsonLineStub({
        value: '"just a string"',
      });

      const result = sessionIdExtractorTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {JSON number literal} => returns null', () => {
      const line = StreamJsonLineStub({
        value: '12345',
      });

      const result = sessionIdExtractorTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {JSON boolean literal} => returns null', () => {
      const line = StreamJsonLineStub({
        value: 'true',
      });

      const result = sessionIdExtractorTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {JSON null literal} => returns null', () => {
      const line = StreamJsonLineStub({
        value: 'null',
      });

      const result = sessionIdExtractorTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {JSON array} => returns null', () => {
      const line = StreamJsonLineStub({
        value: '["session_id", "abc-123"]',
      });

      const result = sessionIdExtractorTransformer({ line });

      expect(result).toBeNull();
    });
  });

  describe('invalid JSON handling', () => {
    it('ERROR: {invalid JSON} => returns null', () => {
      const line = StreamJsonLineStub({
        value: 'not valid json',
      });

      const result = sessionIdExtractorTransformer({ line });

      expect(result).toBeNull();
    });

    it('ERROR: {truncated JSON} => returns null', () => {
      const line = StreamJsonLineStub({
        value: '{"session_id":"abc',
      });

      const result = sessionIdExtractorTransformer({ line });

      expect(result).toBeNull();
    });
  });
});
