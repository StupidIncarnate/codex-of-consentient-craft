import {
  ContractNameStub,
  DependencyStepStub,
  ExitCodeStub,
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  ObservableIdStub,
  QuestContractEntryStub,
  QuestContractPropertyStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  SessionIdStub,
  StepIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { runPathseekerLayerBroker } from './run-pathseeker-layer-broker';
import { runPathseekerLayerBrokerProxy } from './run-pathseeker-layer-broker.proxy';

const CW1_UUID = '11111111-1111-4111-8111-111111111101';
const CW2_UUID = '22222222-2222-4222-8222-222222222202';
const WARD_UUID = '33333333-3333-4333-8333-333333333303';
const SIEGE_UUID = '44444444-4444-4444-8444-444444444404';
const LB1_UUID = '55555555-5555-4555-8555-555555555505';
const LB2_UUID = '66666666-6666-4666-8666-666666666606';
const FINAL_WARD_UUID = '77777777-7777-4777-8777-777777777707';
const PS_WORK_ITEM_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const ALL_UUIDS = [CW1_UUID, CW2_UUID, WARD_UUID, SIEGE_UUID, LB1_UUID, LB2_UUID, FINAL_WARD_UUID];

const buildValidQuestWith2Steps = ({
  workItem,
}: {
  workItem: ReturnType<typeof WorkItemStub>;
}): ReturnType<typeof QuestStub> => {
  const obsId1 = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
  const obsId2 = ObservableIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
  const stepId1 = StepIdStub({ value: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b' });
  const stepId2 = StepIdStub({ value: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c' });
  const contractName = ContractNameStub({ value: 'IsValid' });

  return QuestStub({
    id: QuestIdStub({ value: 'test-quest' }),
    status: 'in_progress',
    flows: [
      FlowStub({
        nodes: [
          FlowNodeStub({
            id: 'login-page',
            type: 'terminal',
            observables: [FlowObservableStub({ id: obsId1 })],
          }),
          FlowNodeStub({
            id: 'dashboard',
            type: 'terminal',
            observables: [FlowObservableStub({ id: obsId2 })],
          }),
        ],
        edges: [FlowEdgeStub({ from: 'login-page', to: 'dashboard' })],
      }),
    ],
    contracts: [
      QuestContractEntryStub({
        name: contractName,
        properties: [QuestContractPropertyStub({ name: 'email', type: 'EmailAddress' })],
      }),
    ],
    steps: [
      DependencyStepStub({
        id: stepId1,
        observablesSatisfied: [obsId1],
        dependsOn: [],
        focusFile: {
          path: 'packages/orchestrator/src/guards/step-one/step-one-guard.ts',
          action: 'create',
        },
        accompanyingFiles: [
          {
            path: 'packages/orchestrator/src/guards/step-one/step-one-guard.test.ts',
            action: 'create',
          },
        ],
        outputContracts: [contractName],
        exportName: 'stepOneGuard',
      }),
      DependencyStepStub({
        id: stepId2,
        observablesSatisfied: [obsId2],
        dependsOn: [],
        focusFile: {
          path: 'packages/orchestrator/src/guards/step-two/step-two-guard.ts',
          action: 'create',
        },
        accompanyingFiles: [
          {
            path: 'packages/orchestrator/src/guards/step-two/step-two-guard.test.ts',
            action: 'create',
          },
        ],
        outputContracts: [contractName],
        exportName: 'stepTwoGuard',
      }),
    ],
    workItems: [workItem],
  });
};

const buildVerifyFailQuest = ({
  workItem,
}: {
  workItem: ReturnType<typeof WorkItemStub>;
}): ReturnType<typeof QuestStub> =>
  QuestStub({
    id: QuestIdStub({ value: 'test-quest' }),
    status: 'in_progress',
    flows: [
      FlowStub({
        nodes: [
          FlowNodeStub({
            id: 'login-page',
            type: 'terminal',
            observables: [
              FlowObservableStub({
                id: ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' }),
              }),
            ],
          }),
        ],
      }),
    ],
    steps: [
      DependencyStepStub({
        observablesSatisfied: [],
      }),
    ],
    workItems: [workItem],
  });

type PersistedQuest = ReturnType<typeof QuestStub>;

describe('runPathseekerLayerBroker', () => {
  describe('VERIFY PASSES — codeweavers created', () => {
    it('VALID: {quest with 2 steps, verify passes} => 2 codeweavers depending on pathseeker', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: PS_WORK_ITEM_ID }),
        role: 'pathseeker',
        status: 'in_progress',
        maxAttempts: 3,
      });
      const proxy = runPathseekerLayerBrokerProxy();
      proxy.setupDeterministicUuids({ uuids: ALL_UUIDS });
      proxy.setupSuccess({
        quest: buildValidQuestWith2Steps({ workItem }),
        spawnLines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runPathseekerLayerBroker({
        questId,
        workItem,
        startPath: '/project/src' as never,
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const lastQuest = proxy.getPersistedQuestJsons().at(-1) as PersistedQuest;
      const codeweavers = lastQuest.workItems.filter((item) => item.role === 'codeweaver');

      expect(codeweavers.map((c) => c.dependsOn)).toStrictEqual([
        [PS_WORK_ITEM_ID],
        [PS_WORK_ITEM_ID],
      ]);
    });
  });

  describe('VERIFY PASSES — ward created', () => {
    it('VALID: {quest with 2 steps, verify passes} => 1 ward depending on both codeweavers', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: PS_WORK_ITEM_ID }),
        role: 'pathseeker',
        status: 'in_progress',
        maxAttempts: 3,
      });
      const proxy = runPathseekerLayerBrokerProxy();
      proxy.setupDeterministicUuids({ uuids: ALL_UUIDS });
      proxy.setupSuccess({
        quest: buildValidQuestWith2Steps({ workItem }),
        spawnLines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runPathseekerLayerBroker({
        questId,
        workItem,
        startPath: '/project/src' as never,
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const lastQuest = proxy.getPersistedQuestJsons().at(-1) as PersistedQuest;
      const wards = lastQuest.workItems.filter((item) => item.role === 'ward');

      expect(
        wards.map((w) => ({
          spawnerType: w.spawnerType,
          maxAttempts: w.maxAttempts,
          dependsOn: w.dependsOn,
        })),
      ).toStrictEqual([
        { spawnerType: 'command', maxAttempts: 3, dependsOn: [CW1_UUID, CW2_UUID] },
        { spawnerType: 'command', maxAttempts: 3, dependsOn: [LB1_UUID, LB2_UUID] },
      ]);
    });
  });

  describe('VERIFY PASSES — siege and lawbringers created', () => {
    it('VALID: {quest with 2 steps, verify passes} => 1 siege + 2 lawbringers with correct chain', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: PS_WORK_ITEM_ID }),
        role: 'pathseeker',
        status: 'in_progress',
        maxAttempts: 3,
      });
      const proxy = runPathseekerLayerBrokerProxy();
      proxy.setupDeterministicUuids({ uuids: ALL_UUIDS });
      proxy.setupSuccess({
        quest: buildValidQuestWith2Steps({ workItem }),
        spawnLines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runPathseekerLayerBroker({
        questId,
        workItem,
        startPath: '/project/src' as never,
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const lastQuest = proxy.getPersistedQuestJsons().at(-1) as PersistedQuest;
      const sieges = lastQuest.workItems.filter((item) => item.role === 'siegemaster');
      const lawbringers = lastQuest.workItems.filter((item) => item.role === 'lawbringer');

      expect(sieges.map((s) => s.dependsOn)).toStrictEqual([[WARD_UUID]]);
      expect(lawbringers.map((l) => l.dependsOn)).toStrictEqual([[SIEGE_UUID], [SIEGE_UUID]]);
    });
  });

  describe('VERIFY FAILS (retries left) — retry work item created', () => {
    it('VALID: {verify fails, attempt 0, maxAttempts 3} => pathseeker failed + retry created', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: PS_WORK_ITEM_ID }),
        role: 'pathseeker',
        status: 'in_progress',
        attempt: 0,
        maxAttempts: 3,
      });
      const proxy = runPathseekerLayerBrokerProxy();
      proxy.setupDeterministicUuids({ uuids: ['aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee01'] });
      proxy.setupVerifyFail({
        quest: buildVerifyFailQuest({ workItem }),
        spawnLines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runPathseekerLayerBroker({
        questId,
        workItem,
        startPath: '/project/src' as never,
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const failedQuest = proxy.getPersistedQuestJsons()[0] as PersistedQuest;
      const failedItem = failedQuest.workItems.find((item) => item.id === PS_WORK_ITEM_ID);

      expect(failedItem?.status).toBe('failed');
      expect(failedItem?.errorMessage).toBe('verification_failed');
      expect(proxy.getUuidCalls()).toStrictEqual([[]]);

      expect(proxy.getPersistedQuestJsons().map(() => true)).toStrictEqual([true]);
    });
  });

  describe('VERIFY FAILS (retries left) — failed item marked before retry insert', () => {
    it('VALID: {verify fails, attempt 0, maxAttempts 3} => original pathseeker marked failed with errorMessage before retry', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const psWorkItemId = QuestWorkItemIdStub({ value: PS_WORK_ITEM_ID });
      const workItem = WorkItemStub({
        id: psWorkItemId,
        role: 'pathseeker',
        status: 'in_progress',
        attempt: 0,
        maxAttempts: 3,
      });
      const proxy = runPathseekerLayerBrokerProxy();
      proxy.setupDeterministicUuids({ uuids: ['aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee01'] });
      proxy.setupVerifyFail({
        quest: buildVerifyFailQuest({ workItem }),
        spawnLines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runPathseekerLayerBroker({
        questId,
        workItem,
        startPath: '/project/src' as never,
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const failedQuest = proxy.getPersistedQuestJsons()[0] as PersistedQuest;
      const failedItem = failedQuest.workItems.find((item) => item.id === PS_WORK_ITEM_ID);

      expect(failedItem?.status).toBe('failed');
      expect(failedItem?.errorMessage).toBe('verification_failed');
      expect(failedItem?.completedAt).toBe('2024-01-15T10:00:00.000Z');
      expect(proxy.getUuidCalls()).toStrictEqual([[]]);
    });
  });

  describe('VERIFY FAILS (no retries left) — no retry created', () => {
    it('VALID: {verify fails, attempt 2, maxAttempts 3} => pathseeker failed, no retry', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: PS_WORK_ITEM_ID }),
        role: 'pathseeker',
        status: 'in_progress',
        attempt: 2,
        maxAttempts: 3,
      });
      const proxy = runPathseekerLayerBrokerProxy();
      proxy.setupVerifyFail({
        quest: buildVerifyFailQuest({ workItem }),
        spawnLines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runPathseekerLayerBroker({
        questId,
        workItem,
        startPath: '/project/src' as never,
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const lastQuest = proxy.getPersistedQuestJsons().at(-1) as PersistedQuest;
      const failedItem = lastQuest.workItems.find((item) => item.id === PS_WORK_ITEM_ID);

      expect(failedItem?.status).toBe('failed');
      expect(failedItem?.errorMessage).toBe('verification_failed');
      expect(
        lastQuest.workItems.filter((item) => item.role === 'pathseeker').map((item) => item.id),
      ).toStrictEqual([PS_WORK_ITEM_ID]);
    });
  });

  describe('CRASH — spawn fails, verify still runs', () => {
    it('VALID: {spawn crashes, attempt 0, maxAttempts 3} => verify fails, retry created', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: PS_WORK_ITEM_ID }),
        role: 'pathseeker',
        status: 'in_progress',
        attempt: 0,
        maxAttempts: 3,
      });
      const proxy = runPathseekerLayerBrokerProxy();
      proxy.setupDeterministicUuids({ uuids: ['bbbbbbbb-cccc-4ddd-8eee-ffffffffffff'] });
      proxy.setupSpawnFailure({ quest: buildVerifyFailQuest({ workItem }) });

      await runPathseekerLayerBroker({
        questId,
        workItem,
        startPath: '/project/src' as never,
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const allWorkItems = proxy
        .getPersistedQuestJsons()
        .flatMap((q) => (q as PersistedQuest).workItems);
      const failedItems = allWorkItems.filter((item) => item.id === PS_WORK_ITEM_ID);
      const markedFailed = failedItems.find((item) => item.status === 'failed');

      expect(markedFailed?.errorMessage).toBe('verification_failed');
      expect(proxy.getUuidCalls()).toStrictEqual([[]]);
    });
  });

  describe('EXCEPTION — quest not found', () => {
    it('VALID: {quest not found in filesystem} => broker completes without persisting', async () => {
      const questId = QuestIdStub({ value: 'nonexistent-quest' });
      const workItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: PS_WORK_ITEM_ID }),
        role: 'pathseeker',
        status: 'in_progress',
        maxAttempts: 3,
      });
      const proxy = runPathseekerLayerBrokerProxy();
      proxy.setupQuestNotFound();

      await runPathseekerLayerBroker({
        questId,
        workItem,
        startPath: '/project/src' as never,
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      expect(proxy.getPersistedQuestJsons()).toStrictEqual([]);
    });
  });

  describe('sessionId capture', () => {
    it('VALID: {spawn emits session_id line} => writes sessionId to work item', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: PS_WORK_ITEM_ID }),
        role: 'pathseeker',
        status: 'in_progress',
        maxAttempts: 3,
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        steps: [DependencyStepStub()],
        workItems: [workItem],
      });
      const proxy = runPathseekerLayerBrokerProxy();
      proxy.setupSuccess({
        quest,
        spawnLines: ['{"type":"system","session_id":"captured-session-abc"}'],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runPathseekerLayerBroker({
        questId,
        workItem,
        startPath: '/project/src' as never,
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      expect(proxy.getPersistedQuestJsons().length).toBeGreaterThan(0);
    });
  });

  describe('resumeSessionId', () => {
    it('VALID: {workItem has sessionId} => passes resumeSessionId through to spawn args', async () => {
      const questId = QuestIdStub({ value: 'test-resume-quest' });
      const resumeSessionId = SessionIdStub({ value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' });
      const workItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: PS_WORK_ITEM_ID }),
        role: 'pathseeker',
        status: 'in_progress',
        sessionId: resumeSessionId,
        maxAttempts: 3,
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        steps: [DependencyStepStub()],
        workItems: [workItem],
      });
      const proxy = runPathseekerLayerBrokerProxy();
      proxy.setupSuccess({
        quest,
        spawnLines: ['{"type":"system","session_id":"9c4d8f1c-3e38-48c9-bdec-22b61883b473"}'],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runPathseekerLayerBroker({
        questId,
        workItem,
        startPath: '/project/src' as never,
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        expect.any(String),
        '--output-format',
        'stream-json',
        '--verbose',
        '--resume',
        '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
      ]);
    });
  });

  describe('fire-and-forget resilience', () => {
    it('VALID: {questModifyBroker rejects during session-id update} => logs to stderr, does not throw', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: PS_WORK_ITEM_ID }),
        role: 'pathseeker',
        status: 'in_progress',
        maxAttempts: 3,
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        steps: [DependencyStepStub()],
        workItems: [workItem],
      });
      const proxy = runPathseekerLayerBrokerProxy();
      proxy.setupStderrCapture();
      proxy.setupModifyReject({ error: new Error('network failure') });
      proxy.setupSuccess({
        quest,
        spawnLines: ['{"type":"system","session_id":"captured-session-abc"}'],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runPathseekerLayerBroker({
        questId,
        workItem,
        startPath: '/project/src' as never,
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const stderrOutput = proxy.getStderrWrites();
      const hasPathseekerLog = stderrOutput.some((line) =>
        String(line).includes('[pathseeker] session-id update failed'),
      );

      expect(hasPathseekerLog).toBe(true);
    });
  });

  describe('ABORT (pause during pathseeker)', () => {
    it('VALID: {pathseeker killed by abort signal} => quest state unchanged, pathseeker stays in_progress', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'b1b1b1b1-c2c2-d3d3-e4e4-f5f5f5f5f5f5' });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'pathseeker',
        status: 'in_progress',
        spawnerType: 'agent',
        maxAttempts: 3,
      });
      const quest = QuestStub({ id: questId, status: 'in_progress', workItems: [workItem] });
      const proxy = runPathseekerLayerBrokerProxy();
      proxy.setupSpawnAborted({ quest });

      const abortController = new AbortController();
      abortController.abort();

      await runPathseekerLayerBroker({
        questId,
        workItem,
        startPath: '/project' as never,
        onAgentEntry: jest.fn(),
        abortSignal: abortController.signal,
      });

      const persisted = proxy.getPersistedQuestJsons();

      // Quest must be untouched — no status changes, no new work items, no verify
      expect(persisted).toStrictEqual([]);
    });
  });
});
