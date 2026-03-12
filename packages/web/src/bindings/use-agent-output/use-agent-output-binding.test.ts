import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';
import { AgentOutputLineStub } from '../../contracts/agent-output-line/agent-output-line.stub';
import { SlotIndexStub } from '../../contracts/slot-index/slot-index.stub';

import { useAgentOutputBinding } from './use-agent-output-binding';
import { useAgentOutputBindingProxy } from './use-agent-output-binding.proxy';

describe('useAgentOutputBinding', () => {
  describe('initial state', () => {
    it('EMPTY: {} => returns empty map initially', () => {
      const proxy = useAgentOutputBindingProxy();
      proxy.setupEmpty();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useAgentOutputBinding(),
      });

      expect(result.current.slotEntries.size).toBe(0);
    });
  });

  describe('handleAgentOutput', () => {
    it('VALID: {slotIndex, lines with valid JSONL} => parses and appends entries to slot', () => {
      const proxy = useAgentOutputBindingProxy();
      proxy.setupEmpty();
      const slotIndex = SlotIndexStub({ value: 0 });
      const line = AgentOutputLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: { content: [{ type: 'text', text: 'Building...' }] },
        }),
      });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useAgentOutputBinding(),
      });

      testingLibraryActAdapter({
        callback: () => {
          result.current.handleAgentOutput({ slotIndex, lines: [line] });
        },
      });

      const entries = result.current.slotEntries.get(slotIndex);

      expect(entries).toBeDefined();
      expect(entries!.length).toBeGreaterThan(0);
    });

    it('VALID: {multiple calls} => accumulates entries', () => {
      const proxy = useAgentOutputBindingProxy();
      proxy.setupEmpty();
      const slotIndex = SlotIndexStub({ value: 0 });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useAgentOutputBinding(),
      });

      testingLibraryActAdapter({
        callback: () => {
          result.current.handleAgentOutput({
            slotIndex,
            lines: [
              AgentOutputLineStub({
                value: JSON.stringify({
                  type: 'assistant',
                  message: { content: [{ type: 'text', text: 'line 1' }] },
                }),
              }),
            ],
          });
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          result.current.handleAgentOutput({
            slotIndex,
            lines: [
              AgentOutputLineStub({
                value: JSON.stringify({
                  type: 'assistant',
                  message: { content: [{ type: 'text', text: 'line 2' }] },
                }),
              }),
            ],
          });
        },
      });

      const entries = result.current.slotEntries.get(slotIndex);

      expect(entries).toBeDefined();
      expect(entries!).toHaveLength(2);
    });
  });

  describe('clearOutput', () => {
    it('VALID: {after appending} => clears all output', () => {
      const proxy = useAgentOutputBindingProxy();
      proxy.setupEmpty();
      const slotIndex = SlotIndexStub({ value: 0 });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useAgentOutputBinding(),
      });

      testingLibraryActAdapter({
        callback: () => {
          result.current.handleAgentOutput({
            slotIndex,
            lines: [
              AgentOutputLineStub({
                value: JSON.stringify({
                  type: 'assistant',
                  message: { content: [{ type: 'text', text: 'some output' }] },
                }),
              }),
            ],
          });
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          result.current.clearOutput();
        },
      });

      expect(result.current.slotEntries.size).toBe(0);
    });
  });
});
