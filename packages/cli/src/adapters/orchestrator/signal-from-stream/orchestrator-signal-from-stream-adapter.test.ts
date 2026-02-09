/**
 * PURPOSE: Tests for orchestratorSignalFromStreamAdapter
 */
import { StreamJsonLineStub, StreamSignalStub } from '@dungeonmaster/orchestrator/testing';

import { orchestratorSignalFromStreamAdapter } from './orchestrator-signal-from-stream-adapter';
import { orchestratorSignalFromStreamAdapterProxy } from './orchestrator-signal-from-stream-adapter.proxy';

describe('orchestratorSignalFromStreamAdapter', () => {
  describe('successful extraction', () => {
    it('VALID: {line with signal-back tool use} => returns stream signal', () => {
      orchestratorSignalFromStreamAdapterProxy();
      const signal = StreamSignalStub();
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [
              {
                type: 'tool_use',
                name: 'mcp__dungeonmaster__signal-back',
                input: signal,
              },
            ],
          },
        }),
      });

      const result = orchestratorSignalFromStreamAdapter({ line });

      expect(result).toStrictEqual(signal);
    });

    it('VALID: {line without signal-back} => returns null', () => {
      orchestratorSignalFromStreamAdapterProxy();
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [{ type: 'text', text: 'Hello' }],
          },
        }),
      });

      const result = orchestratorSignalFromStreamAdapter({ line });

      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('EDGE: {non-assistant message} => returns null', () => {
      orchestratorSignalFromStreamAdapterProxy();
      const line = StreamJsonLineStub({
        value: JSON.stringify({ type: 'init', session_id: 'abc' }),
      });

      const result = orchestratorSignalFromStreamAdapter({ line });

      expect(result).toBeNull();
    });
  });
});
