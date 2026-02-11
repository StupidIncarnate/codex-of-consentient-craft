import { AgentSlotStub } from '../../contracts/agent-slot/agent-slot.stub';
import { SlotCountStub } from '../../contracts/slot-count/slot-count.stub';
import { SlotIndexStub } from '../../contracts/slot-index/slot-index.stub';
import { slotCountToSlotOperationsTransformer } from './slot-count-to-slot-operations-transformer';

describe('slotCountToSlotOperationsTransformer', () => {
  describe('getAvailableSlot', () => {
    it('VALID: {slotCount: 3, no assignments} => returns slot index 0', () => {
      const slotCount = SlotCountStub({ value: 3 });
      const slotOperations = slotCountToSlotOperationsTransformer({ slotCount });

      const result = slotOperations.getAvailableSlot({ slotCount });

      expect(result).toBe(0);
    });

    it('VALID: {slotCount: 3, slot 0 assigned} => returns slot index 1', () => {
      const slotCount = SlotCountStub({ value: 3 });
      const slotOperations = slotCountToSlotOperationsTransformer({ slotCount });
      const agentSlot = AgentSlotStub();
      slotOperations.assignSlot({ slotIndex: SlotIndexStub({ value: 0 }), agentSlot });

      const result = slotOperations.getAvailableSlot({ slotCount });

      expect(result).toBe(1);
    });

    it('VALID: {slotCount: 2, all slots assigned} => returns undefined', () => {
      const slotCount = SlotCountStub({ value: 2 });
      const slotOperations = slotCountToSlotOperationsTransformer({ slotCount });
      const agentSlot = AgentSlotStub();
      slotOperations.assignSlot({ slotIndex: SlotIndexStub({ value: 0 }), agentSlot });
      slotOperations.assignSlot({ slotIndex: SlotIndexStub({ value: 1 }), agentSlot });

      const result = slotOperations.getAvailableSlot({ slotCount });

      expect(result).toBeUndefined();
    });
  });

  describe('assignSlot', () => {
    it('VALID: {assign to slot 0} => slot is no longer available', () => {
      const slotCount = SlotCountStub({ value: 1 });
      const slotOperations = slotCountToSlotOperationsTransformer({ slotCount });
      const agentSlot = AgentSlotStub();

      slotOperations.assignSlot({ slotIndex: SlotIndexStub({ value: 0 }), agentSlot });

      expect(slotOperations.getAvailableSlot({ slotCount })).toBeUndefined();
    });

    it('VALID: {reassign occupied slot} => overwrites with new agent', () => {
      const slotCount = SlotCountStub({ value: 2 });
      const slotOperations = slotCountToSlotOperationsTransformer({ slotCount });
      const originalAgent = AgentSlotStub({ stepId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const replacementAgent = AgentSlotStub({ stepId: 'b2c3d4e5-f6a7-5b8c-9d0e-1f2a3b4c5d6e' });
      slotOperations.assignSlot({
        slotIndex: SlotIndexStub({ value: 0 }),
        agentSlot: originalAgent,
      });

      slotOperations.assignSlot({
        slotIndex: SlotIndexStub({ value: 0 }),
        agentSlot: replacementAgent,
      });

      const result = slotOperations.getActiveSlots();

      expect(result).toStrictEqual([
        {
          slotIndex: 0,
          agentSlot: {
            stepId: 'b2c3d4e5-f6a7-5b8c-9d0e-1f2a3b4c5d6e',
            sessionId: 'session-test-123',
            process: { kill: expect.any(Function), waitForExit: expect.any(Function) },
            startedAt: '2024-01-15T10:00:00.000Z',
          },
        },
      ]);
    });
  });

  describe('releaseSlot', () => {
    it('VALID: {release assigned slot} => returns true and slot becomes available', () => {
      const slotCount = SlotCountStub({ value: 1 });
      const slotOperations = slotCountToSlotOperationsTransformer({ slotCount });
      const agentSlot = AgentSlotStub();
      slotOperations.assignSlot({ slotIndex: SlotIndexStub({ value: 0 }), agentSlot });

      const result = slotOperations.releaseSlot({ slotIndex: SlotIndexStub({ value: 0 }) });

      expect(result).toBe(true);
      expect(slotOperations.getAvailableSlot({ slotCount })).toBe(0);
    });

    it('VALID: {release unoccupied slot} => returns true', () => {
      const slotCount = SlotCountStub({ value: 1 });
      const slotOperations = slotCountToSlotOperationsTransformer({ slotCount });

      const result = slotOperations.releaseSlot({ slotIndex: SlotIndexStub({ value: 0 }) });

      expect(result).toBe(true);
    });

    it('VALID: {release non-existent slot} => returns false', () => {
      const slotCount = SlotCountStub({ value: 1 });
      const slotOperations = slotCountToSlotOperationsTransformer({ slotCount });

      const result = slotOperations.releaseSlot({ slotIndex: SlotIndexStub({ value: 5 }) });

      expect(result).toBe(false);
    });
  });

  describe('getActiveSlots', () => {
    it('EMPTY: {no assignments} => returns empty array', () => {
      const slotCount = SlotCountStub({ value: 3 });
      const slotOperations = slotCountToSlotOperationsTransformer({ slotCount });

      const result = slotOperations.getActiveSlots();

      expect(result).toStrictEqual([]);
    });

    it('VALID: {one slot assigned} => returns array with one active slot', () => {
      const slotCount = SlotCountStub({ value: 3 });
      const slotOperations = slotCountToSlotOperationsTransformer({ slotCount });
      const agentSlot = AgentSlotStub();
      slotOperations.assignSlot({ slotIndex: SlotIndexStub({ value: 1 }), agentSlot });

      const result = slotOperations.getActiveSlots();

      expect(result).toStrictEqual([
        {
          slotIndex: 1,
          agentSlot: {
            stepId: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
            sessionId: 'session-test-123',
            process: { kill: expect.any(Function), waitForExit: expect.any(Function) },
            startedAt: '2024-01-15T10:00:00.000Z',
          },
        },
      ]);
    });

    it('VALID: {two slots assigned} => returns array with two active slots', () => {
      const slotCount = SlotCountStub({ value: 3 });
      const slotOperations = slotCountToSlotOperationsTransformer({ slotCount });
      const agentSlot0 = AgentSlotStub({ stepId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const agentSlot2 = AgentSlotStub({ stepId: 'b2c3d4e5-f6a7-5b8c-9d0e-1f2a3b4c5d6e' });
      slotOperations.assignSlot({ slotIndex: SlotIndexStub({ value: 0 }), agentSlot: agentSlot0 });
      slotOperations.assignSlot({ slotIndex: SlotIndexStub({ value: 2 }), agentSlot: agentSlot2 });

      const result = slotOperations.getActiveSlots();

      expect(result).toStrictEqual([
        {
          slotIndex: 0,
          agentSlot: {
            stepId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
            sessionId: 'session-test-123',
            process: { kill: expect.any(Function), waitForExit: expect.any(Function) },
            startedAt: '2024-01-15T10:00:00.000Z',
          },
        },
        {
          slotIndex: 2,
          agentSlot: {
            stepId: 'b2c3d4e5-f6a7-5b8c-9d0e-1f2a3b4c5d6e',
            sessionId: 'session-test-123',
            process: { kill: expect.any(Function), waitForExit: expect.any(Function) },
            startedAt: '2024-01-15T10:00:00.000Z',
          },
        },
      ]);
    });

    it('VALID: {assign then release} => returns empty array', () => {
      const slotCount = SlotCountStub({ value: 2 });
      const slotOperations = slotCountToSlotOperationsTransformer({ slotCount });
      const agentSlot = AgentSlotStub();
      slotOperations.assignSlot({ slotIndex: SlotIndexStub({ value: 0 }), agentSlot });
      slotOperations.releaseSlot({ slotIndex: SlotIndexStub({ value: 0 }) });

      const result = slotOperations.getActiveSlots();

      expect(result).toStrictEqual([]);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {slotCount: 0} => getAvailableSlot returns undefined', () => {
      const slotCount = SlotCountStub({ value: 0 });
      const slotOperations = slotCountToSlotOperationsTransformer({ slotCount });

      const result = slotOperations.getAvailableSlot({ slotCount });

      expect(result).toBeUndefined();
    });

    it('EDGE: {slotCount: 0} => getActiveSlots returns empty array', () => {
      const slotCount = SlotCountStub({ value: 0 });
      const slotOperations = slotCountToSlotOperationsTransformer({ slotCount });

      const result = slotOperations.getActiveSlots();

      expect(result).toStrictEqual([]);
    });
  });
});
