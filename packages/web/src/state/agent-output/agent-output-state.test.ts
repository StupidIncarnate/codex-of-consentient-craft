import { AssistantTextChatEntryStub } from '../../contracts/chat-entry/chat-entry.stub';
import { SlotIndexStub } from '../../contracts/slot-index/slot-index.stub';

import { agentOutputState } from './agent-output-state';
import { agentOutputStateProxy } from './agent-output-state.proxy';

describe('agentOutputState', () => {
  describe('append and get', () => {
    it('VALID: {append entries to slot} => get returns entries for slot', () => {
      const proxy = agentOutputStateProxy();
      proxy.setupEmptyOutput();
      const slotIndex = SlotIndexStub({ value: 0 });
      const entry1 = AssistantTextChatEntryStub({ content: 'Building project...' });
      const entry2 = AssistantTextChatEntryStub({ content: 'Done.' });

      agentOutputState.append({ slotIndex, entries: [entry1, entry2] });
      const result = agentOutputState.get({ slotIndex });

      expect(result).toStrictEqual([entry1, entry2]);
    });

    it('VALID: {append enforces max entries limit} => keeps latest 500 entries', () => {
      const proxy = agentOutputStateProxy();
      proxy.setupEmptyOutput();
      const slotIndex = SlotIndexStub({ value: 0 });
      const initialEntries = Array.from({ length: 498 }, (_, i) =>
        AssistantTextChatEntryStub({ content: `line-${String(i)}` }),
      );
      const extraEntries = [
        AssistantTextChatEntryStub({ content: 'extra-1' }),
        AssistantTextChatEntryStub({ content: 'extra-2' }),
        AssistantTextChatEntryStub({ content: 'extra-3' }),
      ];

      agentOutputState.append({ slotIndex, entries: initialEntries });
      agentOutputState.append({ slotIndex, entries: extraEntries });
      const result = agentOutputState.get({ slotIndex });

      expect(result).toHaveLength(500);
      expect(result[499]?.role).toBe('assistant');
    });
  });

  describe('clear', () => {
    it('VALID: {clear after append} => removes all output', () => {
      const proxy = agentOutputStateProxy();
      proxy.setupEmptyOutput();
      const slotIndex0 = SlotIndexStub({ value: 0 });
      const slotIndex1 = SlotIndexStub({ value: 1 });

      agentOutputState.append({
        slotIndex: slotIndex0,
        entries: [AssistantTextChatEntryStub({ content: 'slot-0-entry' })],
      });
      agentOutputState.append({
        slotIndex: slotIndex1,
        entries: [AssistantTextChatEntryStub({ content: 'slot-1-entry' })],
      });
      agentOutputState.clear();

      expect(agentOutputState.get({ slotIndex: slotIndex0 })).toStrictEqual([]);
      expect(agentOutputState.get({ slotIndex: slotIndex1 })).toStrictEqual([]);
      expect(agentOutputState.size()).toBe(0);
    });
  });

  describe('clearSlot', () => {
    it('VALID: {clearSlot} => removes only specific slot', () => {
      const proxy = agentOutputStateProxy();
      proxy.setupEmptyOutput();
      const slotIndex0 = SlotIndexStub({ value: 0 });
      const slotIndex1 = SlotIndexStub({ value: 1 });
      const entry0 = AssistantTextChatEntryStub({ content: 'slot-0-entry' });
      const entry1 = AssistantTextChatEntryStub({ content: 'slot-1-entry' });

      agentOutputState.append({ slotIndex: slotIndex0, entries: [entry0] });
      agentOutputState.append({ slotIndex: slotIndex1, entries: [entry1] });
      agentOutputState.clearSlot({ slotIndex: slotIndex0 });

      expect(agentOutputState.get({ slotIndex: slotIndex0 })).toStrictEqual([]);
      expect(agentOutputState.get({ slotIndex: slotIndex1 })).toStrictEqual([entry1]);
      expect(agentOutputState.size()).toBe(1);
    });
  });

  describe('get empty', () => {
    it('EMPTY: {get on empty slot} => returns empty array', () => {
      const proxy = agentOutputStateProxy();
      proxy.setupEmptyOutput();
      const slotIndex = SlotIndexStub({ value: 99 });

      const result = agentOutputState.get({ slotIndex });

      expect(result).toStrictEqual([]);
    });
  });

  describe('size', () => {
    it('VALID: {two slots with output} => returns correct slot count', () => {
      const proxy = agentOutputStateProxy();
      proxy.setupEmptyOutput();
      const slotIndex0 = SlotIndexStub({ value: 0 });
      const slotIndex1 = SlotIndexStub({ value: 1 });

      agentOutputState.append({
        slotIndex: slotIndex0,
        entries: [AssistantTextChatEntryStub({ content: 'entry-a' })],
      });
      agentOutputState.append({
        slotIndex: slotIndex1,
        entries: [AssistantTextChatEntryStub({ content: 'entry-b' })],
      });

      expect(agentOutputState.size()).toBe(2);
    });
  });
});
