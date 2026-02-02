/**
 * PURPOSE: Tests for orchestratorStreamJsonToToolUseAdapter
 */
import { StreamJsonLineStub } from '@dungeonmaster/orchestrator/testing';

import { orchestratorStreamJsonToToolUseAdapter } from './orchestrator-stream-json-to-tool-use-adapter';
import { orchestratorStreamJsonToToolUseAdapterProxy } from './orchestrator-stream-json-to-tool-use-adapter.proxy';

describe('orchestratorStreamJsonToToolUseAdapter', () => {
  describe('successful extraction', () => {
    it('VALID: {line with tool_use} => returns formatted tool use display', () => {
      orchestratorStreamJsonToToolUseAdapterProxy();
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [
              {
                type: 'tool_use',
                name: 'Read',
                input: { file_path: '/src/index.ts' },
              },
            ],
          },
        }),
      });

      const result = orchestratorStreamJsonToToolUseAdapter({ line });

      expect(result).toStrictEqual(expect.stringMatching(/^\[Read\].*\n$/su));
    });

    it('VALID: {line without tool_use} => returns null', () => {
      orchestratorStreamJsonToToolUseAdapterProxy();
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [{ type: 'text', text: 'Hello' }],
          },
        }),
      });

      const result = orchestratorStreamJsonToToolUseAdapter({ line });

      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('EDGE: {non-assistant message} => returns null', () => {
      orchestratorStreamJsonToToolUseAdapterProxy();
      const line = StreamJsonLineStub({
        value: JSON.stringify({ type: 'init', session_id: 'abc' }),
      });

      const result = orchestratorStreamJsonToToolUseAdapter({ line });

      expect(result).toBeNull();
    });
  });
});
