import { FilePathStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { SlotCountStub } from '../../../contracts/slot-count/slot-count.stub';
import { SlotOperationsStub } from '../../../contracts/slot-operations/slot-operations.stub';
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

  describe('abortSignal already aborted', () => {
    it('VALID: {abortSignal already aborted} => returns completed false immediately', async () => {
      runOrchestrationLayerBrokerProxy();
      const incompleteId = WorkItemIdStub({ value: 'work-item-incomplete' });
      const failedId = WorkItemIdStub({ value: 'work-item-failed' });
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        getReadyWorkIds: () => [incompleteId],
        getIncompleteIds: () => [incompleteId, failedId],
        getFailedIds: () => [failedId],
      });

      const startPath = FilePathStub({ value: '/project/src' });
      const abortController = new AbortController();
      abortController.abort();

      const result = await runOrchestrationLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        slotOperations: SlotOperationsStub(),
        activeAgents: [],
        sessionIds: {},
        abortSignal: abortController.signal,
      });

      expect(result).toStrictEqual({
        completed: false,
        incompleteIds: ['work-item-incomplete', 'work-item-failed'],
        failedIds: ['work-item-failed'],
        sessionIds: {},
      });
    });
  });

  describe('onWorkItemSummary passthrough', () => {
    it('VALID: {all work complete, onWorkItemSummary provided} => returns completed true', async () => {
      runOrchestrationLayerBrokerProxy();
      const workTracker = WorkTrackerStub({
        isAllComplete: () => true,
        isAllTerminal: () => true,
        getReadyWorkIds: () => [],
        getFailedIds: () => [],
      });

      const startPath = FilePathStub({ value: '/project/src' });
      const onWorkItemSummary = jest.fn();

      const result = await runOrchestrationLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        slotOperations: SlotOperationsStub(),
        activeAgents: [],
        sessionIds: {},
        onWorkItemSummary,
      });

      expect(result).toStrictEqual({ completed: true, sessionIds: {} });
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
