import { NetworkLogEntryStub } from '../../contracts/network-log-entry/network-log-entry.stub';
import { WsLogEntryStub } from '../../contracts/ws-log-entry/ws-log-entry.stub';

import { networkLogFormatTransformer } from './network-log-format-transformer';

describe('networkLogFormatTransformer', () => {
  describe('empty inputs', () => {
    it('EMPTY: {no entries, no wsEntries} => returns empty string', () => {
      const result = networkLogFormatTransformer({ entries: [], wsEntries: [] });

      expect(result).toBe('');
    });
  });

  describe('HTTP entries only', () => {
    it('VALID: {single entry} => formats with header and closing delimiter', () => {
      const entry = NetworkLogEntryStub({
        method: 'GET',
        url: '/api/guilds',
        status: 200,
        durationMs: 12,
        source: 'mock',
        responseBody: '[{"id":"abc","name":"Test Guild"}]',
      });

      const result = networkLogFormatTransformer({ entries: [entry], wsEntries: [] });

      expect(result).toBe(
        '--- Network Log (1 requests) ---\n' +
          'GET  /api/guilds \u2192 200 (12ms) [mock]\n' +
          '  \u2192 (no body)\n' +
          '  \u2190 [{"id":"abc","name":"Test Guild"}]\n' +
          '---',
      );
    });

    it('VALID: {multiple entries} => formats all entries with count in header', () => {
      const entry1 = NetworkLogEntryStub({
        method: 'GET',
        url: '/api/guilds',
        status: 200,
        durationMs: 12,
        source: 'mock',
      });
      const entry2 = NetworkLogEntryStub({
        method: 'POST',
        url: '/api/quests',
        status: 400,
        durationMs: 8,
        source: 'bypass',
        requestBody: '{"title":"Fix bug"}',
        responseBody: '{"error":"bad request"}',
      });

      const result = networkLogFormatTransformer({ entries: [entry1, entry2], wsEntries: [] });

      expect(result).toBe(
        '--- Network Log (2 requests) ---\n' +
          'GET  /api/guilds \u2192 200 (12ms) [mock]\n' +
          '  \u2192 (no body)\n' +
          '  \u2190 (no body)\n' +
          'POST /api/quests \u2192 400 (8ms) [bypass]\n' +
          '  \u2192 {"title":"Fix bug"}\n' +
          '  \u2190 {"error":"bad request"}\n' +
          '---',
      );
    });
  });

  describe('WebSocket entries only', () => {
    it('VALID: {single ws entry} => formats with WebSocket header', () => {
      const wsEntry = WsLogEntryStub({
        direction: 'received',
        data: '{"type":"quest-modified"}',
        elapsedMs: 12,
      });

      const result = networkLogFormatTransformer({ entries: [], wsEntries: [wsEntry] });

      expect(result).toBe(
        '--- WebSocket (1 messages) ---\n+12ms \u2190 {"type":"quest-modified"}\n---',
      );
    });
  });

  describe('mixed entries', () => {
    it('VALID: {HTTP and WS entries} => formats both sections', () => {
      const httpEntry = NetworkLogEntryStub({
        method: 'GET',
        url: '/api/guilds',
        status: 200,
        durationMs: 12,
        source: 'mock',
      });
      const wsEntry1 = WsLogEntryStub({
        direction: 'received',
        data: '{"type":"quest-modified","payload":{"id":"abc","status":"in_progress"}}',
        elapsedMs: 12,
      });
      const wsEntry2 = WsLogEntryStub({
        direction: 'received',
        data: '{"type":"chat-output","payload":{"text":"Hello"}}',
        elapsedMs: 45,
      });

      const result = networkLogFormatTransformer({
        entries: [httpEntry],
        wsEntries: [wsEntry1, wsEntry2],
      });

      expect(result).toBe(
        '--- Network Log (1 requests) ---\n' +
          'GET  /api/guilds \u2192 200 (12ms) [mock]\n' +
          '  \u2192 (no body)\n' +
          '  \u2190 (no body)\n' +
          '--- WebSocket (2 messages) ---\n' +
          '+12ms \u2190 {"type":"quest-modified","payload":{"id":"abc","status":"in_progress"}}\n' +
          '+45ms \u2190 {"type":"chat-output","payload":{"text":"Hello"}}\n' +
          '---',
      );
    });
  });

  describe('body truncation', () => {
    it('VALID: {long response body} => truncates body to max length', () => {
      const longBody = 'x'.repeat(1501);
      const entry = NetworkLogEntryStub({
        method: 'GET',
        url: '/api/data',
        status: 200,
        durationMs: 100,
        source: 'mock',
        responseBody: longBody,
      });

      const result = networkLogFormatTransformer({ entries: [entry], wsEntries: [] });

      expect(result).toBe(
        `--- Network Log (1 requests) ---\n` +
          `GET  /api/data \u2192 200 (100ms) [mock]\n` +
          `  \u2192 (no body)\n` +
          `  \u2190 ${'x'.repeat(1500)}...\n` +
          `---`,
      );
    });
  });
});
