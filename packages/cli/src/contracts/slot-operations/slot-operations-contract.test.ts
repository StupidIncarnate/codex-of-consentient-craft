import { slotOperationsContract } from './slot-operations-contract';
import { SlotOperationsStub } from './slot-operations.stub';
import { AgentSlotStub } from '../agent-slot/agent-slot.stub';
import { SlotCountStub } from '../slot-count/slot-count.stub';
import { SlotIndexStub } from '../slot-index/slot-index.stub';

describe('slotOperationsContract', () => {
  describe('parse()', () => {
    describe('valid input', () => {
      it('VALID: {all functions provided} => parses successfully', () => {
        const slotOps = SlotOperationsStub();

        const result = slotOperationsContract.parse(slotOps);

        expect(result).toStrictEqual({
          getAvailableSlot: expect.any(Function),
          assignSlot: expect.any(Function),
          releaseSlot: expect.any(Function),
          getActiveSlots: expect.any(Function),
        });
      });
    });

    describe('invalid input', () => {
      it('INVALID_GET_AVAILABLE_SLOT: {getAvailableSlot: string} => throws', () => {
        expect(() =>
          slotOperationsContract.parse({
            getAvailableSlot: 'not-a-function',
            assignSlot: () => undefined,
            releaseSlot: () => true,
            getActiveSlots: () => [],
          }),
        ).toThrow(/Expected function, received string/u);
      });

      it('INVALID_ASSIGN_SLOT: {assignSlot: string} => throws', () => {
        expect(() =>
          slotOperationsContract.parse({
            getAvailableSlot: () => 0,
            assignSlot: 'not-a-function',
            releaseSlot: () => true,
            getActiveSlots: () => [],
          }),
        ).toThrow(/Expected function, received string/u);
      });

      it('INVALID_RELEASE_SLOT: {releaseSlot: string} => throws', () => {
        expect(() =>
          slotOperationsContract.parse({
            getAvailableSlot: () => 0,
            assignSlot: () => undefined,
            releaseSlot: 'not-a-function',
            getActiveSlots: () => [],
          }),
        ).toThrow(/Expected function, received string/u);
      });

      it('INVALID_GET_ACTIVE_SLOTS: {getActiveSlots: string} => throws', () => {
        expect(() =>
          slotOperationsContract.parse({
            getAvailableSlot: () => 0,
            assignSlot: () => undefined,
            releaseSlot: () => true,
            getActiveSlots: 'not-a-function',
          }),
        ).toThrow(/Expected function, received string/u);
      });

      it('INVALID_MULTIPLE: {missing all functions} => throws', () => {
        expect(() => slotOperationsContract.parse({})).toThrow(/Required/u);
      });
    });
  });

  describe('SlotOperationsStub()', () => {
    describe('default behavior', () => {
      it('VALID: {default} => getAvailableSlot returns 0', () => {
        const { getAvailableSlot } = SlotOperationsStub();
        const slotCount = SlotCountStub({ value: 3 });

        const result = getAvailableSlot({ slotCount });

        expect(result).toBe(0);
      });

      it('VALID: {default} => assignSlot completes without error', () => {
        const { assignSlot } = SlotOperationsStub();
        const slotIndex = SlotIndexStub({ value: 0 });
        const agentSlot = AgentSlotStub();

        expect(() => {
          assignSlot({ slotIndex, agentSlot });
        }).not.toThrow();
      });

      it('VALID: {default} => releaseSlot returns true', () => {
        const { releaseSlot } = SlotOperationsStub();
        const slotIndex = SlotIndexStub({ value: 0 });

        const result = releaseSlot({ slotIndex });

        expect(result).toBe(true);
      });

      it('VALID: {default} => getActiveSlots returns empty array', () => {
        const { getActiveSlots } = SlotOperationsStub();

        const result = getActiveSlots();

        expect(result).toStrictEqual([]);
      });
    });

    describe('custom overrides', () => {
      it('VALID: {custom getAvailableSlot} => uses provided function', () => {
        const customSlotIndex = SlotIndexStub({ value: 2 });
        const { getAvailableSlot } = SlotOperationsStub({
          getAvailableSlot: () => customSlotIndex,
        });
        const slotCount = SlotCountStub({ value: 3 });

        const result = getAvailableSlot({ slotCount });

        expect(result).toBe(customSlotIndex);
      });

      it('VALID: {custom getAvailableSlot returning undefined} => returns undefined when no slot available', () => {
        const { getAvailableSlot } = SlotOperationsStub({
          getAvailableSlot: () => undefined,
        });
        const slotCount = SlotCountStub({ value: 3 });

        const result = getAvailableSlot({ slotCount });

        expect(result).toBeUndefined();
      });

      it('VALID: {custom releaseSlot} => uses provided function', () => {
        const { releaseSlot } = SlotOperationsStub({
          releaseSlot: () => false,
        });
        const slotIndex = SlotIndexStub({ value: 0 });

        const result = releaseSlot({ slotIndex });

        expect(result).toBe(false);
      });

      it('VALID: {custom getActiveSlots} => uses provided function', () => {
        const slotIndex = SlotIndexStub({ value: 1 });
        const agentSlot = AgentSlotStub();
        const { getActiveSlots } = SlotOperationsStub({
          getActiveSlots: () => [{ slotIndex, agentSlot }],
        });

        const result = getActiveSlots();

        expect(result).toStrictEqual([
          {
            slotIndex,
            agentSlot: {
              stepId: agentSlot.stepId,
              sessionId: agentSlot.sessionId,
              startedAt: agentSlot.startedAt,
              process: {
                kill: expect.any(Function),
                waitForExit: expect.any(Function),
              },
            },
          },
        ]);
      });
    });
  });
});
