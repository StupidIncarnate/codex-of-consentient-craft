import { FilePathStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { SlotCountStub } from '../../../contracts/slot-count/slot-count.stub';
import { SlotOperationsStub } from '../../../contracts/slot-operations/slot-operations.stub';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';
import { WorkItemIdStub } from '../../../contracts/work-item-id/work-item-id.stub';
import { WorkTrackerStub } from '../../../contracts/work-tracker/work-tracker.stub';
import { runOrchestrationLayerBroker } from './run-orchestration-layer-broker';
import { runOrchestrationLayerBrokerProxy } from './run-orchestration-layer-broker.proxy';

describe('runOrchestrationLayerBroker', () => {
  describe('immediate completion', () => {
    it('VALID: {all work complete, no active agents} => returns completed true', async () => {
      runOrchestrationLayerBrokerProxy();
      const workTracker = WorkTrackerStub({
        isAllComplete: () => true,
        isAllTerminal: () => true,
        getReadyWorkIds: () => [],
        getFailedIds: () => [],
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await runOrchestrationLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        slotOperations: SlotOperationsStub(),
        activeAgents: [],
        sessionIds: {},
      });

      expect(result).toStrictEqual({ completed: true, sessionIds: {} });
    });
  });

  describe('no work available', () => {
    it('VALID: {no ready ids, no active agents} => returns completed true', async () => {
      runOrchestrationLayerBrokerProxy();
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [],
        getFailedIds: () => [],
      });

      const startPath = FilePathStub({ value: '/project/src' });
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: () => undefined,
      });

      const result = await runOrchestrationLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        slotOperations,
        activeAgents: [],
        sessionIds: {},
      });

      expect(result).toStrictEqual({
        completed: false,
        incompleteIds: [],
        failedIds: [],
        sessionIds: {},
      });
    });
  });

  describe('stuck state', () => {
    it('VALID: {failed work item, no agents, no ready ids} => returns completed false with failedIds', async () => {
      runOrchestrationLayerBrokerProxy();
      const failedId = WorkItemIdStub({ value: 'work-item-failed' });
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [failedId],
        getFailedIds: () => [failedId],
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await runOrchestrationLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        slotOperations: SlotOperationsStub(),
        activeAgents: [],
        sessionIds: {},
      });

      expect(result).toStrictEqual({
        completed: false,
        incompleteIds: ['work-item-failed'],
        failedIds: ['work-item-failed'],
        sessionIds: {},
      });
    });
  });
});
