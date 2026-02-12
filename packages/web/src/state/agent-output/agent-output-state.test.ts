import { AgentOutputLineStub } from '../../contracts/agent-output-line/agent-output-line.stub';
import { SlotIndexStub } from '../../contracts/slot-index/slot-index.stub';

import { agentOutputState } from './agent-output-state';
import { agentOutputStateProxy } from './agent-output-state.proxy';

describe('agentOutputState', () => {
  describe('append and get', () => {
    it('VALID: {append lines to slot} => get returns lines for slot', () => {
      const proxy = agentOutputStateProxy();
      proxy.setupEmptyOutput();
      const slotIndex = SlotIndexStub({ value: 0 });
      const line1 = AgentOutputLineStub({ value: 'Building project...' });
      const line2 = AgentOutputLineStub({ value: 'Done.' });

      agentOutputState.append({ slotIndex, lines: [line1, line2] });
      const result = agentOutputState.get({ slotIndex });

      expect(result).toStrictEqual(['Building project...', 'Done.']);
    });

    it('VALID: {append enforces max lines limit} => keeps latest 500 lines', () => {
      const proxy = agentOutputStateProxy();
      proxy.setupEmptyOutput();
      const slotIndex = SlotIndexStub({ value: 0 });
      const initialLines = Array.from({ length: 498 }, (_, i) =>
        AgentOutputLineStub({ value: `line-${String(i)}` }),
      );
      const extraLines = [
        AgentOutputLineStub({ value: 'extra-1' }),
        AgentOutputLineStub({ value: 'extra-2' }),
        AgentOutputLineStub({ value: 'extra-3' }),
      ];

      agentOutputState.append({ slotIndex, lines: initialLines });
      agentOutputState.append({ slotIndex, lines: extraLines });
      const result = agentOutputState.get({ slotIndex });

      expect(result).toHaveLength(500);
      expect(result[0]).toBe('line-1');
      expect(result[496]).toBe('line-497');
      expect(result.slice(497)).toStrictEqual(['extra-1', 'extra-2', 'extra-3']);
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
        lines: [AgentOutputLineStub({ value: 'slot-0-line' })],
      });
      agentOutputState.append({
        slotIndex: slotIndex1,
        lines: [AgentOutputLineStub({ value: 'slot-1-line' })],
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

      agentOutputState.append({
        slotIndex: slotIndex0,
        lines: [AgentOutputLineStub({ value: 'slot-0-line' })],
      });
      agentOutputState.append({
        slotIndex: slotIndex1,
        lines: [AgentOutputLineStub({ value: 'slot-1-line' })],
      });
      agentOutputState.clearSlot({ slotIndex: slotIndex0 });

      expect(agentOutputState.get({ slotIndex: slotIndex0 })).toStrictEqual([]);
      expect(agentOutputState.get({ slotIndex: slotIndex1 })).toStrictEqual(['slot-1-line']);
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
        lines: [AgentOutputLineStub({ value: 'line-a' })],
      });
      agentOutputState.append({
        slotIndex: slotIndex1,
        lines: [AgentOutputLineStub({ value: 'line-b' })],
      });

      expect(agentOutputState.size()).toBe(2);
    });
  });
});
