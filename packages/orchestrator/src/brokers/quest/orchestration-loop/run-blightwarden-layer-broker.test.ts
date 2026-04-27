import {
  DesignDecisionStub,
  ExitCodeStub,
  FilePathStub,
  PlanningScopeClassificationStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { SlotIndexStub } from '../../../contracts/slot-index/slot-index.stub';
import { StreamSignalStub } from '../../../contracts/stream-signal/stream-signal.stub';
import { runBlightwardenLayerBroker } from './run-blightwarden-layer-broker';
import { runBlightwardenLayerBrokerProxy } from './run-blightwarden-layer-broker.proxy';

describe('runBlightwardenLayerBroker', () => {
  describe('export', () => {
    it('VALID: {module} => exports a function', () => {
      expect(runBlightwardenLayerBroker).toStrictEqual(expect.any(Function));
    });
  });

  describe('complete signal', () => {
    it('VALID: {signal: complete} => marks blightwarden item complete with completedAt', async () => {
      const blightWorkItemId = QuestWorkItemIdStub({
        value: 'a1111111-1111-4111-8111-111111111111',
      });
      const workItem = WorkItemStub({
        id: blightWorkItemId,
        role: 'blightwarden',
      });
      const quest = QuestStub({ workItems: [workItem] });

      const proxy = runBlightwardenLayerBrokerProxy();
      proxy.setupSpawnWithSignal({
        quest,
        exitCode: ExitCodeStub({ value: 0 }),
        signal: StreamSignalStub({ signal: 'complete', summary: 'All clear' as never }),
      });

      await runBlightwardenLayerBroker({
        questId: quest.id,
        workItem,
        startPath: FilePathStub({ value: '/project' }),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const blightItem = proxy.getPersistedWorkItem({ workItemId: blightWorkItemId });

      expect(blightItem?.status).toBe('complete');
      expect(blightItem?.completedAt).toBe('2024-01-15T10:00:00.000Z');
      expect(blightItem?.summary).toBe('All clear');
    });
  });

  describe('failed signal', () => {
    it('VALID: {signal: failed} => marks blightwarden failed with summary as errorMessage', async () => {
      const blightWorkItemId = QuestWorkItemIdStub({
        value: 'a1111111-1111-4111-8111-111111111111',
      });
      const workItem = WorkItemStub({
        id: blightWorkItemId,
        role: 'blightwarden',
        status: 'in_progress',
      });
      const quest = QuestStub({ workItems: [workItem] });

      const proxy = runBlightwardenLayerBrokerProxy();
      proxy.setupSpawnWithSignal({
        quest,
        exitCode: ExitCodeStub({ value: 1 }),
        signal: StreamSignalStub({
          signal: 'failed',
          summary: 'Audit tooling unavailable' as never,
        }),
      });

      await runBlightwardenLayerBroker({
        questId: quest.id,
        workItem,
        startPath: FilePathStub({ value: '/project' }),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      expect(proxy.getPersistedWorkItemStatus({ workItemId: blightWorkItemId })).toBe('failed');
      expect(proxy.getPersistedWorkItem({ workItemId: blightWorkItemId })?.errorMessage).toBe(
        'Audit tooling unavailable',
      );
    });

    it('VALID: {signal: failed} => pending lawbringer NOT drained and NO pathseeker replan injected', async () => {
      const blightWorkItemId = QuestWorkItemIdStub({
        value: 'a1111111-1111-4111-8111-111111111111',
      });
      const lawbringerWorkItemId = QuestWorkItemIdStub({
        value: 'b2222222-2222-4222-8222-222222222222',
      });
      const workItem = WorkItemStub({
        id: blightWorkItemId,
        role: 'blightwarden',
        status: 'in_progress',
      });
      const lawbringerItem = WorkItemStub({
        id: lawbringerWorkItemId,
        role: 'lawbringer',
        status: 'pending',
        dependsOn: [blightWorkItemId],
      });
      const quest = QuestStub({ workItems: [workItem, lawbringerItem] });

      const proxy = runBlightwardenLayerBrokerProxy();
      proxy.setupSpawnWithSignal({
        quest,
        exitCode: ExitCodeStub({ value: 1 }),
        signal: StreamSignalStub({
          signal: 'failed',
          summary: 'Audit tooling unavailable' as never,
        }),
      });

      await runBlightwardenLayerBroker({
        questId: quest.id,
        workItem,
        startPath: FilePathStub({ value: '/project' }),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      // Pending lawbringer is NOT drained on plain `failed` — handle-signal routing does that
      expect(proxy.getPersistedWorkItemStatus({ workItemId: lawbringerWorkItemId })).toBe(
        'pending',
      );
      // No pathseeker replan injected on plain `failed`
      expect(proxy.getPersistedWorkItemByRole({ role: 'pathseeker' })).toBe(undefined);
    });
  });

  describe('failed-replan signal', () => {
    it('VALID: {signal: failed-replan} => marks blightwarden failed with summary as errorMessage', async () => {
      const blightWorkItemId = QuestWorkItemIdStub({
        value: 'a1111111-1111-4111-8111-111111111111',
      });
      const workItem = WorkItemStub({
        id: blightWorkItemId,
        role: 'blightwarden',
        status: 'in_progress',
      });
      const quest = QuestStub({ workItems: [workItem] });

      const proxy = runBlightwardenLayerBrokerProxy();
      proxy.setupSpawnWithFailedReplan({
        quest,
        exitCode: ExitCodeStub({ value: 1 }),
        signal: StreamSignalStub({
          signal: 'failed-replan',
          summary: 'Semantic findings remain' as never,
        }),
      });

      await runBlightwardenLayerBroker({
        questId: quest.id,
        workItem,
        startPath: FilePathStub({ value: '/project' }),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      expect(proxy.getPersistedWorkItemStatus({ workItemId: blightWorkItemId })).toBe('failed');
      expect(proxy.getPersistedWorkItem({ workItemId: blightWorkItemId })?.errorMessage).toBe(
        'Semantic findings remain',
      );
    });

    it('VALID: {signal: failed-replan} => drains pending items to skipped', async () => {
      const blightWorkItemId = QuestWorkItemIdStub({
        value: 'a1111111-1111-4111-8111-111111111111',
      });
      const lawbringerWorkItemId = QuestWorkItemIdStub({
        value: 'b2222222-2222-4222-8222-222222222222',
      });
      const finalWardWorkItemId = QuestWorkItemIdStub({
        value: 'c3333333-3333-4333-8333-333333333333',
      });
      const workItem = WorkItemStub({
        id: blightWorkItemId,
        role: 'blightwarden',
        status: 'in_progress',
      });
      const lawbringerItem = WorkItemStub({
        id: lawbringerWorkItemId,
        role: 'lawbringer',
        status: 'pending',
        dependsOn: [blightWorkItemId],
      });
      const finalWardItem = WorkItemStub({
        id: finalWardWorkItemId,
        role: 'ward',
        status: 'pending',
        spawnerType: 'command',
        dependsOn: [blightWorkItemId],
      });
      const quest = QuestStub({
        workItems: [workItem, lawbringerItem, finalWardItem],
      });

      const proxy = runBlightwardenLayerBrokerProxy();
      proxy.setupSpawnWithFailedReplan({
        quest,
        exitCode: ExitCodeStub({ value: 1 }),
        signal: StreamSignalStub({
          signal: 'failed-replan',
          summary: 'Semantic findings remain' as never,
        }),
      });

      await runBlightwardenLayerBroker({
        questId: quest.id,
        workItem,
        startPath: FilePathStub({ value: '/project' }),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      expect(proxy.getPersistedWorkItemStatus({ workItemId: lawbringerWorkItemId })).toBe(
        'skipped',
      );
      expect(proxy.getPersistedWorkItemStatus({ workItemId: finalWardWorkItemId })).toBe('skipped');
    });

    it('VALID: {signal: failed-replan} => inserts pathseeker replan depending on blightwarden, insertedBy blightwarden', async () => {
      const blightWorkItemId = QuestWorkItemIdStub({
        value: 'a1111111-1111-4111-8111-111111111111',
      });
      const workItem = WorkItemStub({
        id: blightWorkItemId,
        role: 'blightwarden',
        status: 'in_progress',
      });
      const quest = QuestStub({ workItems: [workItem] });

      const proxy = runBlightwardenLayerBrokerProxy();
      proxy.setupSpawnWithFailedReplan({
        quest,
        exitCode: ExitCodeStub({ value: 1 }),
        signal: StreamSignalStub({
          signal: 'failed-replan',
          summary: 'Semantic findings remain' as never,
        }),
      });

      await runBlightwardenLayerBroker({
        questId: quest.id,
        workItem,
        startPath: FilePathStub({ value: '/project' }),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const pathseekerReplan = proxy.getPersistedWorkItemByRole({ role: 'pathseeker' });

      expect(pathseekerReplan?.status).toBe('pending');
      expect(pathseekerReplan?.dependsOn).toStrictEqual([blightWorkItemId]);
      expect(pathseekerReplan?.insertedBy).toBe(blightWorkItemId);
    });

    it('VALID: {signal: failed-replan with carry-over blightReport} => carry-over reports remain on quest', async () => {
      const blightWorkItemId = QuestWorkItemIdStub({
        value: 'a1111111-1111-4111-8111-111111111111',
      });
      const workItem = WorkItemStub({
        id: blightWorkItemId,
        role: 'blightwarden',
        status: 'in_progress',
      });
      // Pre-seed a carry-over blightReport on planningNotes
      const quest = QuestStub({
        workItems: [workItem],
        planningNotes: {
          surfaceReports: [],
          blightReports: [
            {
              id: 'fd6a9f64-4d28-4a1e-8a00-1b2c3d4e5f60',
              workItemId: 'a1111111-1111-4111-8111-111111111111',
              minion: 'synthesizer',
              status: 'blocking-carry',
              findings: [],
              createdAt: '2024-01-14T00:00:00.000Z',
              reviewedOn: [],
            },
          ],
        } as never,
      });

      const proxy = runBlightwardenLayerBrokerProxy();
      proxy.setupSpawnWithFailedReplan({
        quest,
        exitCode: ExitCodeStub({ value: 1 }),
        signal: StreamSignalStub({
          signal: 'failed-replan',
          summary: 'Semantic findings remain' as never,
        }),
      });

      await runBlightwardenLayerBroker({
        questId: quest.id,
        workItem,
        startPath: FilePathStub({ value: '/project' }),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      // Carry-over blightReport persists on quest.planningNotes.blightReports exactly as-seeded
      expect(proxy.getLastPersistedBlightReports()).toStrictEqual([
        {
          id: 'fd6a9f64-4d28-4a1e-8a00-1b2c3d4e5f60',
          workItemId: 'a1111111-1111-4111-8111-111111111111',
          minion: 'synthesizer',
          status: 'blocking-carry',
          findings: [],
          createdAt: '2024-01-14T00:00:00.000Z',
          reviewedOn: [],
        },
      ]);
    });
  });

  describe('scopeSize handling', () => {
    it('VALID: {scopeSize: small} => spawned prompt contains "Scope Size: small"', async () => {
      const blightWorkItemId = QuestWorkItemIdStub({
        value: 'a1111111-1111-4111-8111-111111111111',
      });
      const workItem = WorkItemStub({
        id: blightWorkItemId,
        role: 'blightwarden',
      });
      const quest = QuestStub({
        workItems: [workItem],
        planningNotes: {
          surfaceReports: [],
          blightReports: [],
          scopeClassification: PlanningScopeClassificationStub({ size: 'small' }),
        } as never,
        designDecisions: [DesignDecisionStub()],
      });

      const proxy = runBlightwardenLayerBrokerProxy();
      proxy.setupSpawnWithSignal({
        quest,
        exitCode: ExitCodeStub({ value: 0 }),
        signal: StreamSignalStub({ signal: 'complete', summary: 'All clear' as never }),
      });

      await runBlightwardenLayerBroker({
        questId: quest.id,
        workItem,
        startPath: FilePathStub({ value: '/project' }),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      expect(proxy.spawnedPromptMatches({ pattern: /Scope Size: small/u })).toBe(true);
    });

    it('VALID: {scopeSize absent} => spawned prompt omits "Scope Size:" line', async () => {
      const blightWorkItemId = QuestWorkItemIdStub({
        value: 'a1111111-1111-4111-8111-111111111111',
      });
      const workItem = WorkItemStub({
        id: blightWorkItemId,
        role: 'blightwarden',
      });
      // Default QuestStub has no scopeClassification in planningNotes
      const quest = QuestStub({ workItems: [workItem] });

      const proxy = runBlightwardenLayerBrokerProxy();
      proxy.setupSpawnWithSignal({
        quest,
        exitCode: ExitCodeStub({ value: 0 }),
        signal: StreamSignalStub({ signal: 'complete', summary: 'All clear' as never }),
      });

      await runBlightwardenLayerBroker({
        questId: quest.id,
        workItem,
        startPath: FilePathStub({ value: '/project' }),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      expect(proxy.spawnedPromptMatches({ pattern: /Scope Size:/u })).toBe(false);
    });
  });

  describe('quest not found', () => {
    it('ERROR: {quest not found} => throws', async () => {
      const proxy = runBlightwardenLayerBrokerProxy();
      proxy.setupQuestNotFound();
      const workItem = WorkItemStub({ role: 'blightwarden' });

      await expect(
        runBlightwardenLayerBroker({
          questId: 'nonexistent' as never,
          workItem,
          startPath: '/some/path' as never,
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).rejects.toThrow(/Quest not found/u);
    });
  });

  describe('fire-and-forget resilience', () => {
    it('VALID: {questModifyBroker rejects during session-id update} => logs to stderr, does not throw', async () => {
      const blightWorkItemId = QuestWorkItemIdStub({
        value: 'a1111111-1111-4111-8111-111111111111',
      });
      const workItem = WorkItemStub({
        id: blightWorkItemId,
        role: 'blightwarden',
      });
      const quest = QuestStub({ workItems: [workItem] });

      const sessionIdLine = JSON.stringify({
        type: 'system',
        session_id: 'captured-session-abc',
      });

      const proxy = runBlightwardenLayerBrokerProxy();
      proxy.setupStderrCapture();
      proxy.setupModifyReject({ error: new Error('network failure') });
      proxy.setupSpawnWithSessionAndSignal({
        quest,
        exitCode: ExitCodeStub({ value: 0 }),
        signal: StreamSignalStub({ signal: 'complete', summary: 'All clear' as never }),
        sessionIdLine,
      });

      await runBlightwardenLayerBroker({
        questId: quest.id,
        workItem,
        startPath: FilePathStub({ value: '/project' }),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const stderrOutput = proxy.getStderrWrites();
      const hasBlightwardenLog = stderrOutput.some((line) =>
        String(line).includes('[blightwarden] session-id update failed'),
      );

      expect(hasBlightwardenLog).toBe(true);
    });
  });

  describe('onAgentEntry payload', () => {
    it('VALID: {agent emits line} => onAgentEntry receives questWorkItemId = workItem.id and slotIndex 0', async () => {
      const blightWorkItemId = QuestWorkItemIdStub({
        value: 'a1111111-1111-4111-8111-111111111111',
      });
      const workItem = WorkItemStub({
        id: blightWorkItemId,
        role: 'blightwarden',
      });
      const quest = QuestStub({ workItems: [workItem] });

      const proxy = runBlightwardenLayerBrokerProxy();
      proxy.setupSpawnWithSignal({
        quest,
        exitCode: ExitCodeStub({ value: 0 }),
        signal: StreamSignalStub({ signal: 'complete', summary: 'All clear' as never }),
      });

      const onAgentEntry = jest.fn();

      await runBlightwardenLayerBroker({
        questId: quest.id,
        workItem,
        startPath: FilePathStub({ value: '/project' }),
        onAgentEntry,
        abortSignal: new AbortController().signal,
      });

      const expectedRawLine = JSON.stringify({
        type: 'assistant',
        message: {
          content: [
            {
              type: 'tool_use',
              id: 'toolu_signal',
              name: 'mcp__dungeonmaster__signal-back',
              input: { signal: 'complete', summary: 'All clear' },
            },
          ],
        },
      });

      expect(onAgentEntry.mock.calls).toStrictEqual([
        [
          {
            slotIndex: SlotIndexStub({ value: 0 }),
            entry: { raw: expectedRawLine },
            questWorkItemId: blightWorkItemId,
          },
        ],
      ]);
    });
  });

  describe('ABORT (pause during blightwarden)', () => {
    it('VALID: {blightwarden killed by abort signal} => quest state unchanged', async () => {
      const questId = 'add-auth' as never;
      const workItemId = QuestWorkItemIdStub({ value: 'a1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5' });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'blightwarden',
        status: 'in_progress',
        spawnerType: 'agent',
        maxAttempts: 1,
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [workItem],
      });
      const proxy = runBlightwardenLayerBrokerProxy();
      proxy.setupSpawnAborted({ quest });

      const abortController = new AbortController();
      abortController.abort();

      await runBlightwardenLayerBroker({
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
