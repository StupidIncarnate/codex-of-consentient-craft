/**
 * PURPOSE: Tests for orchestratorStreamJsonToTextAdapter
 */
import { StreamJsonLineStub } from '@dungeonmaster/orchestrator/testing';

import { orchestratorStreamJsonToTextAdapter } from './orchestrator-stream-json-to-text-adapter';
import { orchestratorStreamJsonToTextAdapterProxy } from './orchestrator-stream-json-to-text-adapter.proxy';

describe('orchestratorStreamJsonToTextAdapter', () => {
  describe('successful extraction', () => {
    it('VALID: {line with text content} => returns text', () => {
      orchestratorStreamJsonToTextAdapterProxy();
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [{ type: 'text', text: 'Hello world' }],
          },
        }),
      });

      const result = orchestratorStreamJsonToTextAdapter({ line });

      expect(result).toBe('Hello world');
    });

    it('VALID: {line without text} => returns null', () => {
      orchestratorStreamJsonToTextAdapterProxy();
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [{ type: 'tool_use', name: 'Read' }],
          },
        }),
      });

      const result = orchestratorStreamJsonToTextAdapter({ line });

      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('EDGE: {non-assistant message} => returns null', () => {
      orchestratorStreamJsonToTextAdapterProxy();
      const line = StreamJsonLineStub({
        value: JSON.stringify({ type: 'init', session_id: 'abc' }),
      });

      const result = orchestratorStreamJsonToTextAdapter({ line });

      expect(result).toBeNull();
    });
  });
});
