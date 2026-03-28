import {
  ExitCodeStub,
  FilePathStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  QuestStub,
  QuestWorkItemIdStub,
  RelatedDataItemStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { StreamSignalStub } from '../../../contracts/stream-signal/stream-signal.stub';
import { runSiegemasterLayerBroker } from './run-siegemaster-layer-broker';
import { runSiegemasterLayerBrokerProxy } from './run-siegemaster-layer-broker.proxy';

const FLOW_REF = RelatedDataItemStub({ value: 'flows/login-flow' });

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
      const workItem = WorkItemStub({
        id: siegeWorkItemId,
        role: 'siegemaster',
        relatedDataItems: [FLOW_REF],
      });
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
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      expect(proxy.getModifyContents().map(() => true)).toStrictEqual([true]);

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
        relatedDataItems: [FLOW_REF],
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
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
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
        relatedDataItems: [FLOW_REF],
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
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const pathseekerReplan = proxy.getPersistedWorkItemByRole({ role: 'pathseeker' });

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
        relatedDataItems: [FLOW_REF],
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
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
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
        relatedDataItems: [FLOW_REF],
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
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
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
      const workItem = WorkItemStub({ role: 'siegemaster', relatedDataItems: [FLOW_REF] });

      await expect(
        runSiegemasterLayerBroker({
          questId: 'nonexistent' as never,
          workItem,
          startPath: '/some/path' as never,
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).rejects.toThrow(/Quest not found/u);
    });
  });

  describe('onAgentEntry wiring', () => {
    it('VALID: {onAgentEntry provided} => completes successfully with onAgentEntry', async () => {
      const observable = FlowObservableStub();
      const node = FlowNodeStub({ observables: [observable] });
      const flow = FlowStub({ nodes: [node] });
      const siegeWorkItemId = QuestWorkItemIdStub({
        value: 'a1111111-1111-4111-8111-111111111111',
      });
      const workItem = WorkItemStub({
        id: siegeWorkItemId,
        role: 'siegemaster',
        relatedDataItems: [FLOW_REF],
      });
      const quest = QuestStub({ flows: [flow], workItems: [workItem] });

      const proxy = runSiegemasterLayerBrokerProxy();
      proxy.setupSpawnWithSignal({
        quest,
        exitCode: ExitCodeStub({ value: 0 }),
        signal: StreamSignalStub({ signal: 'complete', summary: 'All tests pass' as never }),
      });

      const onAgentEntry = jest.fn();

      await runSiegemasterLayerBroker({
        questId: quest.id,
        workItem,
        startPath: FilePathStub({ value: '/project' }),
        onAgentEntry,
        abortSignal: new AbortController().signal,
      });

      const siegeItem = proxy.getPersistedWorkItem({ workItemId: siegeWorkItemId });

      expect(siegeItem?.status).toBe('complete');
    });

    it('VALID: {both params provided with default values} => completes successfully', async () => {
      const observable = FlowObservableStub();
      const node = FlowNodeStub({ observables: [observable] });
      const flow = FlowStub({ nodes: [node] });
      const siegeWorkItemId = QuestWorkItemIdStub({
        value: 'a1111111-1111-4111-8111-111111111111',
      });
      const workItem = WorkItemStub({
        id: siegeWorkItemId,
        role: 'siegemaster',
        relatedDataItems: [FLOW_REF],
      });
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
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const siegeItem = proxy.getPersistedWorkItem({ workItemId: siegeWorkItemId });

      expect(siegeItem?.status).toBe('complete');
    });
  });

  describe('fire-and-forget resilience', () => {
    it('VALID: {questModifyBroker rejects during session-id update} => logs to stderr, does not throw', async () => {
      const observable = FlowObservableStub();
      const node = FlowNodeStub({ observables: [observable] });
      const flow = FlowStub({ nodes: [node] });
      const siegeWorkItemId = QuestWorkItemIdStub({
        value: 'a1111111-1111-4111-8111-111111111111',
      });
      const workItem = WorkItemStub({
        id: siegeWorkItemId,
        role: 'siegemaster',
        relatedDataItems: [FLOW_REF],
      });
      const quest = QuestStub({ flows: [flow], workItems: [workItem] });

      const sessionIdLine = JSON.stringify({
        type: 'system',
        session_id: 'captured-session-abc',
      });

      const proxy = runSiegemasterLayerBrokerProxy();
      proxy.setupStderrCapture();
      proxy.setupModifyReject({ error: new Error('network failure') });
      proxy.setupSpawnWithSessionAndSignal({
        quest,
        exitCode: ExitCodeStub({ value: 0 }),
        signal: StreamSignalStub({ signal: 'complete', summary: 'All tests pass' as never }),
        sessionIdLine,
      });

      await runSiegemasterLayerBroker({
        questId: quest.id,
        workItem,
        startPath: FilePathStub({ value: '/project' }),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const stderrOutput = proxy.getStderrWrites();
      const hasSiegemasterLog = stderrOutput.some((line) =>
        String(line).includes('[siegemaster] session-id update failed'),
      );

      expect(hasSiegemasterLog).toBe(true);
    });
  });

  describe('ABORT (pause during siegemaster)', () => {
    it('VALID: {siegemaster killed by abort signal} => quest state unchanged, siegemaster stays in_progress', async () => {
      const questId = 'add-auth' as never;
      const workItemId = QuestWorkItemIdStub({ value: 'a1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5' });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'siegemaster',
        status: 'in_progress',
        spawnerType: 'agent',
        maxAttempts: 1,
        relatedDataItems: [FLOW_REF],
      });
      const flow = FlowStub();
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        flows: [flow],
        workItems: [workItem],
      });
      const proxy = runSiegemasterLayerBrokerProxy();
      proxy.setupSpawnAborted({ quest });

      const abortController = new AbortController();
      abortController.abort();

      await runSiegemasterLayerBroker({
        questId,
        workItem,
        startPath: FilePathStub({ value: '/project' }),
        onAgentEntry: jest.fn(),
        abortSignal: abortController.signal,
      });

      const modifyContents = proxy.getModifyContents();

      // Quest must be untouched — no failed marking, no pathseeker replan, no skipped items
      expect(modifyContents).toStrictEqual([]);
    });
  });
});
