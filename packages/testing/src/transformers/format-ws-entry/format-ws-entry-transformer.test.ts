import { WsLogEntryStub } from '../../contracts/ws-log-entry/ws-log-entry.stub';

import { formatWsEntryTransformer } from './format-ws-entry-transformer';

describe('formatWsEntryTransformer', () => {
  describe('received messages', () => {
    it('VALID: {direction: "received"} => formats with left arrow', () => {
      const wsEntry = WsLogEntryStub({
        direction: 'received',
        data: '{"type":"quest-modified","payload":{"id":"abc","status":"in_progress"}}',
        elapsedMs: 12,
      });

      const result = formatWsEntryTransformer({ wsEntry });

      expect(result).toBe(
        '+12ms \u2190 {"type":"quest-modified","payload":{"id":"abc","status":"in_progress"}}',
      );
    });

    it('VALID: {elapsedMs: 0} => formats with zero elapsed', () => {
      const wsEntry = WsLogEntryStub({
        direction: 'received',
        data: '{"type":"ping"}',
        elapsedMs: 0,
      });

      const result = formatWsEntryTransformer({ wsEntry });

      expect(result).toBe('+0ms \u2190 {"type":"ping"}');
    });
  });

  describe('sent messages', () => {
    it('VALID: {direction: "sent"} => formats with right arrow', () => {
      const wsEntry = WsLogEntryStub({
        direction: 'sent',
        data: '{"type":"subscribe"}',
        elapsedMs: 45,
      });

      const result = formatWsEntryTransformer({ wsEntry });

      expect(result).toBe('+45ms \u2192 {"type":"subscribe"}');
    });
  });
});
