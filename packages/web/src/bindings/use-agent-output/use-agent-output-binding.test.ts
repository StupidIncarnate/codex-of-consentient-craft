import { act, renderHook } from '#gateway/npm/testing-library__react';
import { AssistantTextChatEntryStub } from '@dungeonmaster/shared/contracts/chat-entry/chat-entry.stub';
import { SlotIndexStub } from '@dungeonmaster/shared/contracts/slot-index/slot-index.stub';

import { useAgentOutputBinding } from './use-agent-output-binding';
import { useAgentOutputBindingProxy } from './use-agent-output-binding.proxy';

describe('useAgentOutputBinding', () => {
  describe('initial state', () => {
    it('EMPTY: {} => returns empty map initially', () => {
      const proxy = useAgentOutputBindingProxy();
      proxy.setupEmpty();

      const { result } = renderHook(() => useAgentOutputBinding());

      expect(result.current.slotEntries.size).toBe(0);
    });
  });

  describe('handleAgentOutput', () => {
    it('VALID: {slotIndex, entries with pre-parsed ChatEntry} => appends entries to slot', () => {
      const proxy = useAgentOutputBindingProxy();
      proxy.setupEmpty();
      const slotIndex = SlotIndexStub({ value: 0 });
      const entry = AssistantTextChatEntryStub({ content: 'Building...' });

      const { result } = renderHook(() => useAgentOutputBinding());

      act(() => {
        result.current.handleAgentOutput({ slotIndex, entries: [entry] });
      });

      const entries = result.current.slotEntries.get(slotIndex);

      expect(entries).toStrictEqual([entry]);
    });

    it('VALID: {multiple calls} => accumulates entries', () => {
      const proxy = useAgentOutputBindingProxy();
      proxy.setupEmpty();
      const slotIndex = SlotIndexStub({ value: 0 });
      const entry1 = AssistantTextChatEntryStub({ content: 'line 1' });
      const entry2 = AssistantTextChatEntryStub({ content: 'line 2' });

      const { result } = renderHook(() => useAgentOutputBinding());

      act(() => {
        result.current.handleAgentOutput({ slotIndex, entries: [entry1] });
      });

      act(() => {
        result.current.handleAgentOutput({ slotIndex, entries: [entry2] });
      });

      const entries = result.current.slotEntries.get(slotIndex);

      expect(entries).toStrictEqual([entry1, entry2]);
    });

    it('EMPTY: {empty entries array} => does not update state', () => {
      const proxy = useAgentOutputBindingProxy();
      proxy.setupEmpty();
      const slotIndex = SlotIndexStub({ value: 0 });

      const { result } = renderHook(() => useAgentOutputBinding());

      act(() => {
        result.current.handleAgentOutput({ slotIndex, entries: [] });
      });

      expect(result.current.slotEntries.size).toBe(0);
    });
  });

  describe('clearOutput', () => {
    it('VALID: {after appending} => clears all output', () => {
      const proxy = useAgentOutputBindingProxy();
      proxy.setupEmpty();
      const slotIndex = SlotIndexStub({ value: 0 });
      const entry = AssistantTextChatEntryStub({ content: 'some output' });

      const { result } = renderHook(() => useAgentOutputBinding());

      act(() => {
        result.current.handleAgentOutput({ slotIndex, entries: [entry] });
      });

      act(() => {
        result.current.clearOutput();
      });

      expect(result.current.slotEntries.size).toBe(0);
    });
  });
});
