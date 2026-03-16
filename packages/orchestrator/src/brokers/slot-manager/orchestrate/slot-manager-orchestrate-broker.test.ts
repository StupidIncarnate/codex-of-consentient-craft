import { FilePathStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { SlotCountStub } from '../../../contracts/slot-count/slot-count.stub';
import { SlotOperationsStub } from '../../../contracts/slot-operations/slot-operations.stub';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';
import { WorkItemIdStub } from '../../../contracts/work-item-id/work-item-id.stub';
import { WorkTrackerStub } from '../../../contracts/work-tracker/work-tracker.stub';
import { slotManagerOrchestrateBroker } from './slot-manager-orchestrate-broker';
import { slotManagerOrchestrateBrokerProxy } from './slot-manager-orchestrate-broker.proxy';

describe('slotManagerOrchestrateBroker', () => {
  describe('all work complete', () => {
    it('VALID: {all work complete} => returns completed true', async () => {
      slotManagerOrchestrateBrokerProxy();
      const workTracker = WorkTrackerStub({
        isAllComplete: () => true,
        isAllTerminal: () => true,
        getReadyWorkIds: () => [],
        getFailedIds: () => [],
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await slotManagerOrchestrateBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 3 }),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        slotOperations: SlotOperationsStub(),
      });

      expect(result).toStrictEqual({ completed: true });
    });

    it('VALID: {multiple items all complete} => returns completed true', async () => {
      slotManagerOrchestrateBrokerProxy();
      const workTracker = WorkTrackerStub({
        isAllComplete: () => true,
        isAllTerminal: () => true,
        getReadyWorkIds: () => [],
        getFailedIds: () => [],
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await slotManagerOrchestrateBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 3 }),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        slotOperations: SlotOperationsStub(),
      });

      expect(result).toStrictEqual({ completed: true });
    });
  });

  describe('blocked scenarios', () => {
    it('VALID: {no available slots and no active agents} => returns completed false', async () => {
      slotManagerOrchestrateBrokerProxy();
      const incompleteId = WorkItemIdStub({ value: 'work-item-1' });
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        getReadyWorkIds: () => [incompleteId],
        getIncompleteIds: () => [incompleteId],
        getFailedIds: () => [],
      });

      const startPath = FilePathStub({ value: '/project/src' });
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: () => undefined,
      });

      const result = await slotManagerOrchestrateBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 3 }),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        slotOperations,
      });

      expect(result).toStrictEqual({ completed: true });
    });

    it('VALID: {failed work item, no agents} => returns completed false with failedIds', async () => {
      slotManagerOrchestrateBrokerProxy();
      const failedId = WorkItemIdStub({ value: 'work-item-failed' });
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [failedId],
        getFailedIds: () => [failedId],
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await slotManagerOrchestrateBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 3 }),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        slotOperations: SlotOperationsStub(),
      });

      expect(result).toStrictEqual({
        completed: false,
        incompleteIds: ['work-item-failed'],
        failedIds: ['work-item-failed'],
      });
    });
  });

  // NOTE: Tests for agent spawning, signal handling, crash recovery, and timeout scenarios
  // are covered by orchestration-loop-layer-broker tests.
});
