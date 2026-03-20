import {
  ExitCodeStub,
  FilePathStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { StreamSignalStub } from '../../../contracts/stream-signal/stream-signal.stub';
import { runSiegemasterLayerBroker } from './run-siegemaster-layer-broker';
import { runSiegemasterLayerBrokerProxy } from './run-siegemaster-layer-broker.proxy';

describe('runSiegemasterLayerBroker', () => {
  describe('export', () => {
    it('VALID: {module} => exports a function', () => {
      expect(typeof runSiegemasterLayerBroker).toBe('function');
    });
  });

  describe('complete signal without failure marker', () => {
    it('VALID: {signal: complete, no FAILED OBSERVABLES} => marks siege complete with completedAt', async () => {
      const observable = FlowObservableStub();
      const node = FlowNodeStub({ observables: [observable] });
      const flow = FlowStub({ nodes: [node] });
      const siegeWorkItemId = QuestWorkItemIdStub({
        value: 'a1111111-1111-4111-8111-111111111111',
      });
      const workItem = WorkItemStub({ id: siegeWorkItemId, role: 'siegemaster' });
      const quest = QuestStub({ flows: [flow], workItems: [workItem] });

      const proxy = runSiegemasterLayerBrokerProxy();
      proxy.setupSpawnWithSignal({
        quest,
        exitCode: ExitCodeStub({ value: 0 }),
        signal: StreamSignalStub({ signal: 'complete', summary: 'All tests pass' as never }),
      });

      await runSiegemasterLayerBroker({
        questId: quest.id,
        workItem,
        startPath: FilePathStub({ value: '/project' }),
      });

      expect(proxy.getModifyContents()).toHaveLength(1);

      const siegeItem = proxy.getPersistedWorkItem({ workItemId: siegeWorkItemId });

      expect(siegeItem?.status).toBe('complete');
      expect(siegeItem?.completedAt).toBe('2024-01-15T10:00:00.000Z');
    });
  });

  describe('failed signal', () => {
    it('VALID: {signal: failed} => marks siege failed with errorMessage and skips pending lawbringers', async () => {
      const observable = FlowObservableStub();
      const node = FlowNodeStub({ observables: [observable] });
      const flow = FlowStub({ nodes: [node] });
      const siegeWorkItemId = QuestWorkItemIdStub({
        value: 'a1111111-1111-4111-8111-111111111111',
      });
      const lawbringerWorkItemId = QuestWorkItemIdStub({
        value: 'b2222222-2222-4222-8222-222222222222',
      });
      const workItem = WorkItemStub({
        id: siegeWorkItemId,
        role: 'siegemaster',
        status: 'in_progress',
      });
      const lawbringerItem = WorkItemStub({
        id: lawbringerWorkItemId,
        role: 'lawbringer',
        status: 'pending',
        dependsOn: [siegeWorkItemId],
      });
      const quest = QuestStub({ flows: [flow], workItems: [workItem, lawbringerItem] });

      const proxy = runSiegemasterLayerBrokerProxy();
      proxy.setupSpawnWithSignal({
        quest,
        exitCode: ExitCodeStub({ value: 1 }),
        signal: StreamSignalStub({ signal: 'failed' }),
      });

      await runSiegemasterLayerBroker({
        questId: quest.id,
        workItem,
        startPath: FilePathStub({ value: '/project' }),
      });

      expect(proxy.getPersistedWorkItemStatus({ workItemId: siegeWorkItemId })).toBe('failed');
      expect(proxy.getPersistedWorkItem({ workItemId: siegeWorkItemId })?.errorMessage).toBe(
        'siege_check_failed',
      );
      expect(proxy.getPersistedWorkItemStatus({ workItemId: lawbringerWorkItemId })).toBe(
        'skipped',
      );
    });

    it('VALID: {signal: failed} => creates pathseeker replan with dependsOn [siegeWorkItemId] and insertedBy siege', async () => {
      const observable = FlowObservableStub();
      const node = FlowNodeStub({ observables: [observable] });
      const flow = FlowStub({ nodes: [node] });
      const siegeWorkItemId = QuestWorkItemIdStub({
        value: 'a1111111-1111-4111-8111-111111111111',
      });
      const lawbringerWorkItemId = QuestWorkItemIdStub({
        value: 'b2222222-2222-4222-8222-222222222222',
      });
      const workItem = WorkItemStub({
        id: siegeWorkItemId,
        role: 'siegemaster',
        status: 'in_progress',
      });
      const lawbringerItem = WorkItemStub({
        id: lawbringerWorkItemId,
        role: 'lawbringer',
        status: 'pending',
        dependsOn: [siegeWorkItemId],
      });
      const quest = QuestStub({ flows: [flow], workItems: [workItem, lawbringerItem] });

      const proxy = runSiegemasterLayerBrokerProxy();
      proxy.setupSpawnWithSignal({
        quest,
        exitCode: ExitCodeStub({ value: 1 }),
        signal: StreamSignalStub({ signal: 'failed' }),
      });

      await runSiegemasterLayerBroker({
        questId: quest.id,
        workItem,
        startPath: FilePathStub({ value: '/project' }),
      });

      const pathseekerReplan = proxy.getPersistedWorkItemByRole({ role: 'pathseeker' });

      expect(pathseekerReplan).toBeDefined();
      expect(pathseekerReplan?.status).toBe('pending');
      expect(pathseekerReplan?.dependsOn).toStrictEqual([siegeWorkItemId]);
      expect(pathseekerReplan?.insertedBy).toBe(siegeWorkItemId);
    });
  });

  describe('complete signal with FAILED OBSERVABLES in summary', () => {
    it('VALID: {signal: complete, summary has FAILED OBSERVABLES} => marks siege failed, skips pending, creates pathseeker', async () => {
      const observable = FlowObservableStub();
      const node = FlowNodeStub({ observables: [observable] });
      const flow = FlowStub({ nodes: [node] });
      const siegeWorkItemId = QuestWorkItemIdStub({
        value: 'a1111111-1111-4111-8111-111111111111',
      });
      const lawbringerWorkItemId = QuestWorkItemIdStub({
        value: 'b2222222-2222-4222-8222-222222222222',
      });
      const workItem = WorkItemStub({
        id: siegeWorkItemId,
        role: 'siegemaster',
        status: 'in_progress',
      });
      const lawbringerItem = WorkItemStub({
        id: lawbringerWorkItemId,
        role: 'lawbringer',
        status: 'pending',
        dependsOn: [siegeWorkItemId],
      });
      const quest = QuestStub({ flows: [flow], workItems: [workItem, lawbringerItem] });

      const proxy = runSiegemasterLayerBrokerProxy();
      proxy.setupSpawnWithSignal({
        quest,
        exitCode: ExitCodeStub({ value: 0 }),
        signal: StreamSignalStub({
          signal: 'complete',
          summary: 'FAILED OBSERVABLES: login form did not redirect' as never,
        }),
      });

      await runSiegemasterLayerBroker({
        questId: quest.id,
        workItem,
        startPath: FilePathStub({ value: '/project' }),
      });

      expect(proxy.getPersistedWorkItem({ workItemId: siegeWorkItemId })?.errorMessage).toBe(
        'FAILED OBSERVABLES: login form did not redirect',
      );
      expect(proxy.getPersistedWorkItemStatus({ workItemId: siegeWorkItemId })).toBe('failed');
      expect(proxy.getPersistedWorkItemStatus({ workItemId: lawbringerWorkItemId })).toBe(
        'skipped',
      );
      expect(proxy.getPersistedWorkItemByRole({ role: 'pathseeker' })?.dependsOn).toStrictEqual([
        siegeWorkItemId,
      ]);
    });
  });

  describe('crash / timeout (no signal, exitCode 1)', () => {
    it('VALID: {no signal, exitCode 1} => marks siege failed, skips pending, creates pathseeker replan', async () => {
      const observable = FlowObservableStub();
      const node = FlowNodeStub({ observables: [observable] });
      const flow = FlowStub({ nodes: [node] });
      const siegeWorkItemId = QuestWorkItemIdStub({
        value: 'a1111111-1111-4111-8111-111111111111',
      });
      const lawbringerWorkItemId = QuestWorkItemIdStub({
        value: 'b2222222-2222-4222-8222-222222222222',
      });
      const workItem = WorkItemStub({
        id: siegeWorkItemId,
        role: 'siegemaster',
        status: 'in_progress',
      });
      const lawbringerItem = WorkItemStub({
        id: lawbringerWorkItemId,
        role: 'lawbringer',
        status: 'pending',
        dependsOn: [siegeWorkItemId],
      });
      const quest = QuestStub({ flows: [flow], workItems: [workItem, lawbringerItem] });

      const proxy = runSiegemasterLayerBrokerProxy();
      proxy.setupSpawnSuccess({
        quest,
        exitCode: ExitCodeStub({ value: 1 }),
      });

      await runSiegemasterLayerBroker({
        questId: quest.id,
        workItem,
        startPath: FilePathStub({ value: '/project' }),
      });

      expect(proxy.getPersistedWorkItemStatus({ workItemId: siegeWorkItemId })).toBe('failed');
      expect(proxy.getPersistedWorkItem({ workItemId: siegeWorkItemId })?.errorMessage).toBe(
        'siege_check_failed',
      );
      expect(proxy.getPersistedWorkItemStatus({ workItemId: lawbringerWorkItemId })).toBe(
        'skipped',
      );
      expect(proxy.getPersistedWorkItemByRole({ role: 'pathseeker' })?.dependsOn).toStrictEqual([
        siegeWorkItemId,
      ]);
    });
  });

  describe('quest not found', () => {
    it('ERROR: {quest not found} => throws', async () => {
      const proxy = runSiegemasterLayerBrokerProxy();
      proxy.setupQuestNotFound();
      const workItem = WorkItemStub({ role: 'siegemaster' });

      await expect(
        runSiegemasterLayerBroker({
          questId: 'nonexistent' as never,
          workItem,
          startPath: '/some/path' as never,
        }),
      ).rejects.toThrow(/Quest not found/u);
    });
  });
});
