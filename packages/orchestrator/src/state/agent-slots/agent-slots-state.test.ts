import { agentSlotsState } from './agent-slots-state';
import { agentSlotsStateProxy } from './agent-slots-state.proxy';
import { SlotCountStub } from '../../contracts/slot-count/slot-count.stub';
import { SlotDataStub } from '../../contracts/slot-data/slot-data.stub';
import { SlotIndexStub } from '../../contracts/slot-index/slot-index.stub';

describe('agentSlotsState', () => {
  describe('initialize', () => {
    it('VALID: {slotCount: 3} => initializes 3 empty slots', () => {
      const proxy = agentSlotsStateProxy();
      proxy.setupUninitialized();
      const slotCount = SlotCountStub({ value: 3 });

      agentSlotsState.initialize({ slotCount });

      expect(agentSlotsState.getSlotCount()).toBe(3);
      expect(agentSlotsState.getSlot({ slotId: SlotIndexStub({ value: 0 }) })).toBeNull();
      expect(agentSlotsState.getSlot({ slotId: SlotIndexStub({ value: 1 }) })).toBeNull();
      expect(agentSlotsState.getSlot({ slotId: SlotIndexStub({ value: 2 }) })).toBeNull();
    });

    it('VALID: {reinitialize} => clears previous slots and sets new count', () => {
      const proxy = agentSlotsStateProxy();
      const slotCount2 = SlotCountStub({ value: 2 });
      const slotData = SlotDataStub();
      proxy.setupSlotAssigned({
        slotId: SlotIndexStub({ value: 0 }),
        data: slotData,
        slotCount: slotCount2,
      });
      const slotCount3 = SlotCountStub({ value: 3 });

      agentSlotsState.initialize({ slotCount: slotCount3 });

      expect(agentSlotsState.getSlotCount()).toBe(3);
      expect(agentSlotsState.getActiveCount()).toBe(0);
    });
  });

  describe('assignSlot', () => {
    it('VALID: {slotId: 0, data} => assigns slot successfully', () => {
      const proxy = agentSlotsStateProxy();
      const slotCount = SlotCountStub({ value: 3 });
      proxy.setupEmptySlots({ slotCount });
      const slotId = SlotIndexStub({ value: 0 });
      const slotData = SlotDataStub();

      agentSlotsState.assignSlot({ slotId, data: slotData });
      const result = agentSlotsState.getSlot({ slotId });

      expect(result).toStrictEqual(slotData);
    });

    it('VALID: {multiple slots} => assigns multiple slots', () => {
      const proxy = agentSlotsStateProxy();
      const slotCount = SlotCountStub({ value: 3 });
      proxy.setupEmptySlots({ slotCount });
      const slotId0 = SlotIndexStub({ value: 0 });
      const slotId1 = SlotIndexStub({ value: 1 });
      const slotData0 = SlotDataStub({ sessionId: 'session-0' });
      const slotData1 = SlotDataStub({ sessionId: 'session-1' });

      agentSlotsState.assignSlot({ slotId: slotId0, data: slotData0 });
      agentSlotsState.assignSlot({ slotId: slotId1, data: slotData1 });

      expect(agentSlotsState.getSlot({ slotId: slotId0 })).toStrictEqual(slotData0);
      expect(agentSlotsState.getSlot({ slotId: slotId1 })).toStrictEqual(slotData1);
    });
  });

  describe('releaseSlot', () => {
    it('VALID: {assigned slot} => releases and returns true', () => {
      const proxy = agentSlotsStateProxy();
      const slotId = SlotIndexStub({ value: 0 });
      const slotData = SlotDataStub();
      const slotCount = SlotCountStub({ value: 3 });
      proxy.setupSlotAssigned({ slotId, data: slotData, slotCount });

      const result = agentSlotsState.releaseSlot({ slotId });

      expect(result).toBe(true);
      expect(agentSlotsState.getSlot({ slotId })).toBeNull();
    });

    it('VALID: {empty slot} => returns true (slot exists but is null)', () => {
      const proxy = agentSlotsStateProxy();
      const slotCount = SlotCountStub({ value: 3 });
      proxy.setupEmptySlots({ slotCount });
      const slotId = SlotIndexStub({ value: 0 });

      const result = agentSlotsState.releaseSlot({ slotId });

      expect(result).toBe(true);
    });

    it('EMPTY: {uninitialized slot} => returns false', () => {
      const proxy = agentSlotsStateProxy();
      proxy.setupUninitialized();
      const slotId = SlotIndexStub({ value: 0 });

      const result = agentSlotsState.releaseSlot({ slotId });

      expect(result).toBe(false);
    });
  });

  describe('getSlot', () => {
    it('VALID: {assigned slot} => returns slot data', () => {
      const proxy = agentSlotsStateProxy();
      const slotId = SlotIndexStub({ value: 0 });
      const slotData = SlotDataStub();
      const slotCount = SlotCountStub({ value: 3 });
      proxy.setupSlotAssigned({ slotId, data: slotData, slotCount });

      const result = agentSlotsState.getSlot({ slotId });

      expect(result).toStrictEqual(slotData);
    });

    it('VALID: {empty slot} => returns null', () => {
      const proxy = agentSlotsStateProxy();
      const slotCount = SlotCountStub({ value: 3 });
      proxy.setupEmptySlots({ slotCount });
      const slotId = SlotIndexStub({ value: 0 });

      const result = agentSlotsState.getSlot({ slotId });

      expect(result).toBeNull();
    });

    it('EMPTY: {uninitialized slot} => returns undefined', () => {
      const proxy = agentSlotsStateProxy();
      proxy.setupUninitialized();
      const slotId = SlotIndexStub({ value: 0 });

      const result = agentSlotsState.getSlot({ slotId });

      expect(result).toBeUndefined();
    });
  });

  describe('getAvailableSlotId', () => {
    it('VALID: {all slots empty, slotCount: 3} => returns slot 0', () => {
      const proxy = agentSlotsStateProxy();
      const slotCount = SlotCountStub({ value: 3 });
      proxy.setupEmptySlots({ slotCount });

      const result = agentSlotsState.getAvailableSlotId();

      expect(result).toBe(0);
    });

    it('VALID: {slot 0 assigned, slotCount: 3} => returns slot 1', () => {
      const proxy = agentSlotsStateProxy();
      const slotId0 = SlotIndexStub({ value: 0 });
      const slotData = SlotDataStub();
      const slotCount = SlotCountStub({ value: 3 });
      proxy.setupSlotAssigned({ slotId: slotId0, data: slotData, slotCount });

      const result = agentSlotsState.getAvailableSlotId();

      expect(result).toBe(1);
    });

    it('EMPTY: {all slots assigned, slotCount: 2} => returns undefined', () => {
      const proxy = agentSlotsStateProxy();
      const slotCount = SlotCountStub({ value: 2 });
      proxy.setupEmptySlots({ slotCount });
      const slotId0 = SlotIndexStub({ value: 0 });
      const slotId1 = SlotIndexStub({ value: 1 });
      const slotData0 = SlotDataStub({ sessionId: 'session-0' });
      const slotData1 = SlotDataStub({ sessionId: 'session-1' });
      agentSlotsState.assignSlot({ slotId: slotId0, data: slotData0 });
      agentSlotsState.assignSlot({ slotId: slotId1, data: slotData1 });

      const result = agentSlotsState.getAvailableSlotId();

      expect(result).toBeUndefined();
    });

    it('EMPTY: {uninitialized} => returns undefined', () => {
      const proxy = agentSlotsStateProxy();
      proxy.setupUninitialized();

      const result = agentSlotsState.getAvailableSlotId();

      expect(result).toBeUndefined();
    });
  });

  describe('getActiveSlots', () => {
    it('VALID: {slots assigned} => returns array of active slots', () => {
      const proxy = agentSlotsStateProxy();
      const slotId = SlotIndexStub({ value: 0 });
      const slotData = SlotDataStub();
      const slotCount = SlotCountStub({ value: 3 });
      proxy.setupSlotAssigned({ slotId, data: slotData, slotCount });

      const result = agentSlotsState.getActiveSlots();

      expect(result).toStrictEqual([{ slotId, data: slotData }]);
    });

    it('EMPTY: {no slots assigned} => returns empty array', () => {
      const proxy = agentSlotsStateProxy();
      const slotCount = SlotCountStub({ value: 3 });
      proxy.setupEmptySlots({ slotCount });

      const result = agentSlotsState.getActiveSlots();

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {uninitialized} => returns empty array', () => {
      const proxy = agentSlotsStateProxy();
      proxy.setupUninitialized();

      const result = agentSlotsState.getActiveSlots();

      expect(result).toStrictEqual([]);
    });
  });

  describe('getActiveCount', () => {
    it('VALID: {one slot assigned} => returns 1', () => {
      const proxy = agentSlotsStateProxy();
      const slotId = SlotIndexStub({ value: 0 });
      const slotData = SlotDataStub();
      const slotCount = SlotCountStub({ value: 3 });
      proxy.setupSlotAssigned({ slotId, data: slotData, slotCount });

      const result = agentSlotsState.getActiveCount();

      expect(result).toBe(1);
    });

    it('EMPTY: {no slots assigned} => returns 0', () => {
      const proxy = agentSlotsStateProxy();
      const slotCount = SlotCountStub({ value: 3 });
      proxy.setupEmptySlots({ slotCount });

      const result = agentSlotsState.getActiveCount();

      expect(result).toBe(0);
    });
  });

  describe('getSlotCount', () => {
    it('VALID: {initialized with 3} => returns 3', () => {
      const proxy = agentSlotsStateProxy();
      const slotCount = SlotCountStub({ value: 3 });
      proxy.setupEmptySlots({ slotCount });

      const result = agentSlotsState.getSlotCount();

      expect(result).toBe(3);
    });

    it('EMPTY: {uninitialized} => returns undefined', () => {
      const proxy = agentSlotsStateProxy();
      proxy.setupUninitialized();

      const result = agentSlotsState.getSlotCount();

      expect(result).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('VALID: {slots assigned} => clears all slots and resets slot count', () => {
      const proxy = agentSlotsStateProxy();
      const slotId = SlotIndexStub({ value: 0 });
      const slotData = SlotDataStub();
      const slotCount = SlotCountStub({ value: 3 });
      proxy.setupSlotAssigned({ slotId, data: slotData, slotCount });

      agentSlotsState.clear();

      expect(agentSlotsState.getActiveCount()).toBe(0);
      expect(agentSlotsState.getSlotCount()).toBeUndefined();
    });
  });
});
