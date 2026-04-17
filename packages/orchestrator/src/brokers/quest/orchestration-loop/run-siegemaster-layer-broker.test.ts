import {
  ExitCodeStub,
  FilePathStub,
  FlowIdStub,
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

describe('runSiegemasterLayerBroker', () => {
  describe('export', () => {
    it('VALID: {module} => exports a function', () => {
      expect(runSiegemasterLayerBroker).toStrictEqual(expect.any(Function));
    });
  });

  describe('complete signal without failure', () => {
    it('VALID: {signal: complete} => marks siege complete with completedAt', async () => {
      const observable = FlowObservableStub();
      const node = FlowNodeStub({ observables: [observable] });
      const flow = FlowStub({ nodes: [node] });
      const siegeWorkItemId = QuestWorkItemIdStub({
        value: 'a1111111-1111-4111-8111-111111111111',
      });
      const workItem = WorkItemStub({
        id: siegeWorkItemId,
        role: 'siegemaster',
        relatedDataItems: [RelatedDataItemStub({ value: `flows/${String(flow.id)}` })],
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
      expect(siegeItem?.summary).toBe('All tests pass');
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
        relatedDataItems: [RelatedDataItemStub({ value: `flows/${String(flow.id)}` })],
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
        'Task completed successfully',
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
        relatedDataItems: [RelatedDataItemStub({ value: `flows/${String(flow.id)}` })],
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

    it('VALID: {signal: failed with summary} => persists summary as errorMessage', async () => {
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
        relatedDataItems: [RelatedDataItemStub({ value: `flows/${String(flow.id)}` })],
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
        signal: StreamSignalStub({
          signal: 'failed',
          summary: 'login form did not redirect' as never,
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
        'login form did not redirect',
      );
      expect(proxy.getPersistedWorkItem({ workItemId: siegeWorkItemId })?.summary).toBe(
        'login form did not redirect',
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
        relatedDataItems: [RelatedDataItemStub({ value: `flows/${String(flow.id)}` })],
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
      const workItem = WorkItemStub({ role: 'siegemaster' });

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

  describe('relatedDataItems validation', () => {
    it('ERROR: {empty relatedDataItems} => throws with clear error', async () => {
      const flow = FlowStub();
      const siegeWorkItemId = QuestWorkItemIdStub({
        value: 'a1111111-1111-4111-8111-111111111111',
      });
      const workItem = WorkItemStub({
        id: siegeWorkItemId,
        role: 'siegemaster',
        relatedDataItems: [],
      });
      const quest = QuestStub({ flows: [flow], workItems: [workItem] });

      const proxy = runSiegemasterLayerBrokerProxy();
      proxy.setupQuestFound({ quest });

      await expect(
        runSiegemasterLayerBroker({
          questId: quest.id,
          workItem,
          startPath: FilePathStub({ value: '/project' }),
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).rejects.toThrow(/has no relatedDataItems/u);
    });

    it('ERROR: {flows/<unknown>} => resolver throws, broker propagates', async () => {
      const flow = FlowStub({ id: FlowIdStub({ value: 'known-flow' }) });
      const siegeWorkItemId = QuestWorkItemIdStub({
        value: 'a1111111-1111-4111-8111-111111111111',
      });
      const workItem = WorkItemStub({
        id: siegeWorkItemId,
        role: 'siegemaster',
        relatedDataItems: [RelatedDataItemStub({ value: 'flows/unknown-flow' })],
      });
      const quest = QuestStub({ flows: [flow], workItems: [workItem] });

      const proxy = runSiegemasterLayerBrokerProxy();
      proxy.setupQuestFound({ quest });

      await expect(
        runSiegemasterLayerBroker({
          questId: quest.id,
          workItem,
          startPath: FilePathStub({ value: '/project' }),
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).rejects.toThrow(/Flow unknown-flow not found/u);
    });

    it('ERROR: {steps/<id>} => broker throws expected flows reference', async () => {
      const flow = FlowStub();
      const siegeWorkItemId = QuestWorkItemIdStub({
        value: 'a1111111-1111-4111-8111-111111111111',
      });
      const workItem = WorkItemStub({
        id: siegeWorkItemId,
        role: 'siegemaster',
        relatedDataItems: [
          RelatedDataItemStub({ value: 'steps/f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
        ],
      });
      const quest = QuestStub({ flows: [flow], workItems: [workItem] });

      const proxy = runSiegemasterLayerBrokerProxy();
      proxy.setupQuestFound({ quest });

      await expect(
        runSiegemasterLayerBroker({
          questId: quest.id,
          workItem,
          startPath: FilePathStub({ value: '/project' }),
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).rejects.toThrow(/expected flows reference|not found/u);
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
        relatedDataItems: [RelatedDataItemStub({ value: `flows/${String(flow.id)}` })],
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
        relatedDataItems: [RelatedDataItemStub({ value: `flows/${String(flow.id)}` })],
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
        relatedDataItems: [RelatedDataItemStub({ value: `flows/${String(flow.id)}` })],
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
      const flow = FlowStub();
      const workItemId = QuestWorkItemIdStub({ value: 'a1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5' });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'siegemaster',
        status: 'in_progress',
        spawnerType: 'agent',
        maxAttempts: 1,
        relatedDataItems: [RelatedDataItemStub({ value: `flows/${String(flow.id)}` })],
      });
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

  describe('dev server preflight: build passes + server starts', () => {
    it('VALID: {devServer config, build passes, server starts} => siege runs with devServerUrl in work unit', async () => {
      const observable = FlowObservableStub();
      const node = FlowNodeStub({ observables: [observable] });
      const flow = FlowStub({ nodes: [node] });
      const siegeWorkItemId = QuestWorkItemIdStub({
        value: 'a1111111-1111-4111-8111-111111111111',
      });
      const workItem = WorkItemStub({
        id: siegeWorkItemId,
        role: 'siegemaster',
        relatedDataItems: [RelatedDataItemStub({ value: `flows/${String(flow.id)}` })],
      });
      const quest = QuestStub({ flows: [flow], workItems: [workItem] });

      const proxy = runSiegemasterLayerBrokerProxy();
      proxy.setupWithDevServer({
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

  describe('dev server preflight: build fails once, spiritmender fixes, retry succeeds', () => {
    it('VALID: {build fails once, spiritmender runs, rebuild passes} => siege proceeds to completion', async () => {
      const observable = FlowObservableStub();
      const node = FlowNodeStub({ observables: [observable] });
      const flow = FlowStub({ nodes: [node] });
      const siegeWorkItemId = QuestWorkItemIdStub({
        value: 'a1111111-1111-4111-8111-111111111111',
      });
      const workItem = WorkItemStub({
        id: siegeWorkItemId,
        role: 'siegemaster',
        relatedDataItems: [RelatedDataItemStub({ value: `flows/${String(flow.id)}` })],
      });
      const quest = QuestStub({ flows: [flow], workItems: [workItem] });

      const proxy = runSiegemasterLayerBrokerProxy();
      proxy.setupBuildFails({
        quest,
        buildOutput: 'ERROR: src/index.ts(5,1): error TS2345: type mismatch',
        signal: StreamSignalStub({ signal: 'complete', summary: 'All tests pass' as never }),
        exitCode: ExitCodeStub({ value: 0 }),
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

  describe('dev server preflight: build exhausts retries', () => {
    it('VALID: {build fails 3 times} => marks siege failed with build_preflight_exhausted, creates pathseeker', async () => {
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
        relatedDataItems: [RelatedDataItemStub({ value: `flows/${String(flow.id)}` })],
      });
      const lawbringerItem = WorkItemStub({
        id: lawbringerWorkItemId,
        role: 'lawbringer',
        status: 'pending',
        dependsOn: [siegeWorkItemId],
      });
      const quest = QuestStub({ flows: [flow], workItems: [workItem, lawbringerItem] });

      const proxy = runSiegemasterLayerBrokerProxy();
      proxy.setupBuildExhausted({ quest });

      await runSiegemasterLayerBroker({
        questId: quest.id,
        workItem,
        startPath: FilePathStub({ value: '/project' }),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      expect(proxy.getPersistedWorkItemStatus({ workItemId: siegeWorkItemId })).toBe('failed');
      expect(proxy.getPersistedWorkItem({ workItemId: siegeWorkItemId })?.errorMessage).toBe(
        'build_preflight_exhausted',
      );
      expect(proxy.getPersistedWorkItemStatus({ workItemId: lawbringerWorkItemId })).toBe(
        'skipped',
      );
      expect(proxy.getPersistedWorkItemByRole({ role: 'pathseeker' })?.dependsOn).toStrictEqual([
        siegeWorkItemId,
      ]);
    });
  });

  describe('dev server preflight: server fails to start', () => {
    it('VALID: {build passes, server exits before ready after all retries} => marks siege failed with dev_server_start_exhausted', async () => {
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
        relatedDataItems: [RelatedDataItemStub({ value: `flows/${String(flow.id)}` })],
      });
      const lawbringerItem = WorkItemStub({
        id: lawbringerWorkItemId,
        role: 'lawbringer',
        status: 'pending',
        dependsOn: [siegeWorkItemId],
      });
      const quest = QuestStub({ flows: [flow], workItems: [workItem, lawbringerItem] });

      const proxy = runSiegemasterLayerBrokerProxy();
      proxy.setupServerStartFails({ quest });

      await runSiegemasterLayerBroker({
        questId: quest.id,
        workItem,
        startPath: FilePathStub({ value: '/project' }),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      expect(proxy.getPersistedWorkItemStatus({ workItemId: siegeWorkItemId })).toBe('failed');
      expect(proxy.getPersistedWorkItem({ workItemId: siegeWorkItemId })?.errorMessage).toBe(
        'dev_server_start_exhausted',
      );
      expect(proxy.getPersistedWorkItemByRole({ role: 'pathseeker' })?.dependsOn).toStrictEqual([
        siegeWorkItemId,
      ]);
    });
  });

  describe('no devServer config (backward compat)', () => {
    it('VALID: {no devServer in config} => existing behavior unchanged, siege runs without devServerUrl', async () => {
      const observable = FlowObservableStub();
      const node = FlowNodeStub({ observables: [observable] });
      const flow = FlowStub({ nodes: [node] });
      const siegeWorkItemId = QuestWorkItemIdStub({
        value: 'a1111111-1111-4111-8111-111111111111',
      });
      const workItem = WorkItemStub({
        id: siegeWorkItemId,
        role: 'siegemaster',
        relatedDataItems: [RelatedDataItemStub({ value: `flows/${String(flow.id)}` })],
      });
      const quest = QuestStub({ flows: [flow], workItems: [workItem] });

      const proxy = runSiegemasterLayerBrokerProxy();
      // setupSpawnWithSignal uses DungeonmasterConfigStub() which has no devServer
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

  describe('multi-flow: each siege call resolves its own flow', () => {
    it('VALID: {two siege calls with different flows} => each call resolves its own flow via relatedDataItems', async () => {
      const observable = FlowObservableStub();
      const node = FlowNodeStub({ observables: [observable] });
      const flowOne = FlowStub({ id: FlowIdStub({ value: 'flow-one' }), nodes: [node] });
      const flowTwo = FlowStub({ id: FlowIdStub({ value: 'flow-two' }), nodes: [node] });
      const siege1WorkItemId = QuestWorkItemIdStub({
        value: 'a1111111-1111-4111-8111-111111111111',
      });
      const siege2WorkItemId = QuestWorkItemIdStub({
        value: 'c3333333-3333-4333-8333-333333333333',
      });
      const workItem1 = WorkItemStub({
        id: siege1WorkItemId,
        role: 'siegemaster',
        relatedDataItems: [RelatedDataItemStub({ value: `flows/${String(flowOne.id)}` })],
      });
      const workItem2 = WorkItemStub({
        id: siege2WorkItemId,
        role: 'siegemaster',
        relatedDataItems: [RelatedDataItemStub({ value: `flows/${String(flowTwo.id)}` })],
      });
      const quest = QuestStub({ flows: [flowOne, flowTwo], workItems: [workItem1, workItem2] });

      const proxy = runSiegemasterLayerBrokerProxy();
      const [proc1, proc2] = proxy.setupTwoSequentialWithDevServer({
        quest,
        exitCode: ExitCodeStub({ value: 0 }),
        signal: StreamSignalStub({ signal: 'complete', summary: 'All tests pass' as never }),
      });

      await runSiegemasterLayerBroker({
        questId: quest.id,
        workItem: workItem1,
        startPath: FilePathStub({ value: '/project' }),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      await runSiegemasterLayerBroker({
        questId: quest.id,
        workItem: workItem2,
        startPath: FilePathStub({ value: '/project' }),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      // Both siege runs completed their dev server lifecycle successfully
      expect(proc1.kill).toHaveBeenCalledWith('SIGTERM');
      expect(proc2.kill).toHaveBeenCalledWith('SIGTERM');

      // Siege 2 completed (last persisted state)
      expect(proxy.getPersistedWorkItemStatus({ workItemId: siege2WorkItemId })).toBe('complete');
    });
  });

  describe('multi-flow: first siege fails, second siege gets clean fresh server', () => {
    it('VALID: {first siege fails, second siege succeeds} => second run starts its own fresh server independently', async () => {
      const observable = FlowObservableStub();
      const node = FlowNodeStub({ observables: [observable] });
      const flowOne = FlowStub({ id: FlowIdStub({ value: 'flow-one' }), nodes: [node] });
      const flowTwo = FlowStub({ id: FlowIdStub({ value: 'flow-two' }), nodes: [node] });
      const siege1WorkItemId = QuestWorkItemIdStub({
        value: 'a1111111-1111-4111-8111-111111111111',
      });
      const siege2WorkItemId = QuestWorkItemIdStub({
        value: 'c3333333-3333-4333-8333-333333333333',
      });
      const workItem1 = WorkItemStub({
        id: siege1WorkItemId,
        role: 'siegemaster',
        status: 'in_progress',
        relatedDataItems: [RelatedDataItemStub({ value: `flows/${String(flowOne.id)}` })],
      });
      const workItem2 = WorkItemStub({
        id: siege2WorkItemId,
        role: 'siegemaster',
        relatedDataItems: [RelatedDataItemStub({ value: `flows/${String(flowTwo.id)}` })],
      });
      const quest = QuestStub({ flows: [flowOne, flowTwo], workItems: [workItem1, workItem2] });

      const proxy = runSiegemasterLayerBrokerProxy();
      const proc2 = proxy.setupDevServerWithFirstFailSecondSucceeds({
        quest,
        exitCode: ExitCodeStub({ value: 0 }),
        signal: StreamSignalStub({ signal: 'complete', summary: 'All tests pass' as never }),
      });

      await runSiegemasterLayerBroker({
        questId: quest.id,
        workItem: workItem1,
        startPath: FilePathStub({ value: '/project' }),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      await runSiegemasterLayerBroker({
        questId: quest.id,
        workItem: workItem2,
        startPath: FilePathStub({ value: '/project' }),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      // Second run's server was stopped after successful siege
      expect(proc2.kill).toHaveBeenCalledWith('SIGTERM');
    });
  });

  describe('server stop always called (finally block)', () => {
    it('VALID: {devServer config, agent crashes} => dev server still stopped in finally', async () => {
      const observable = FlowObservableStub();
      const node = FlowNodeStub({ observables: [observable] });
      const flow = FlowStub({ nodes: [node] });
      const siegeWorkItemId = QuestWorkItemIdStub({
        value: 'a1111111-1111-4111-8111-111111111111',
      });
      const workItem = WorkItemStub({
        id: siegeWorkItemId,
        role: 'siegemaster',
        relatedDataItems: [RelatedDataItemStub({ value: `flows/${String(flow.id)}` })],
      });
      const quest = QuestStub({ flows: [flow], workItems: [workItem] });

      const proxy = runSiegemasterLayerBrokerProxy();
      const proc = proxy.setupWithDevServer({
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

      // Process kill was called with SIGTERM from devServerStopBroker
      expect(proc.kill).toHaveBeenCalledWith('SIGTERM');
    });
  });
});
