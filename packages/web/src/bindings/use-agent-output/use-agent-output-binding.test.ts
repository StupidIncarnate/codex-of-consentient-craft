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

      expect(result.current.slotOutputs.size).toBe(0);
    });
  });

  describe('handleAgentOutput', () => {
    it('VALID: {slotIndex, lines} => appends output to slot', () => {
      const proxy = useAgentOutputBindingProxy();
      proxy.setupEmpty();
      const slotIndex = SlotIndexStub({ value: 0 });
      const lines = [AgentOutputLineStub({ value: 'Building...' })];

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useAgentOutputBinding(),
      });

      testingLibraryActAdapter({
        callback: () => {
          result.current.handleAgentOutput({ slotIndex, lines });
        },
      });

      expect(result.current.slotOutputs.get(slotIndex)).toStrictEqual(['Building...']);
    });

    it('VALID: {multiple calls} => accumulates output', () => {
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
            lines: [AgentOutputLineStub({ value: 'line 1' })],
          });
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          result.current.handleAgentOutput({
            slotIndex,
            lines: [AgentOutputLineStub({ value: 'line 2' })],
          });
        },
      });

      expect(result.current.slotOutputs.get(slotIndex)).toStrictEqual(['line 1', 'line 2']);
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
            lines: [AgentOutputLineStub({ value: 'some output' })],
          });
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          result.current.clearOutput();
        },
      });

      expect(result.current.slotOutputs.size).toBe(0);
    });
  });
});
