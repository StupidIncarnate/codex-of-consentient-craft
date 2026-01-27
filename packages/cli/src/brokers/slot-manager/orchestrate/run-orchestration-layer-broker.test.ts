import {
  DependencyStepStub,
  ExitCodeStub,
  FilePathStub,
  SessionIdStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';

import { ActiveAgentStub } from '../../../contracts/active-agent/active-agent.stub';
import { AgentSpawnStreamingResultStub } from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result.stub';
import { SlotCountStub } from '../../../contracts/slot-count/slot-count.stub';
import { SlotIndexStub } from '../../../contracts/slot-index/slot-index.stub';
import { SlotOperationsStub } from '../../../contracts/slot-operations/slot-operations.stub';
import { StreamSignalStub } from '../../../contracts/stream-signal/stream-signal.stub';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';
import { runOrchestrationLayerBroker } from './run-orchestration-layer-broker';
import { runOrchestrationLayerBrokerProxy } from './run-orchestration-layer-broker.proxy';

type ActiveAgent = ReturnType<typeof ActiveAgentStub>;

describe('runOrchestrationLayerBroker', () => {
  describe('immediate completion', () => {
    it('VALID: {all steps complete, no active agents} => returns completed true', async () => {
      const proxy = runOrchestrationLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();

      proxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify({
          id: 'test-quest',
          folder: '001-test',
          title: 'Test Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          contexts: [],
          observables: [],
          steps: [DependencyStepStub({ status: 'complete' })],
          toolingRequirements: [],
        }),
      });

      const result = await runOrchestrationLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        activeAgents: [],
      });

      expect(result).toStrictEqual({ completed: true });
    });
  });

  describe('recursive completion', () => {
    it('VALID: {pending step then completes} => spawns agent and returns completed true', async () => {
      const proxy = runOrchestrationLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const stepId = StepIdStub();
      const slotIndex = SlotIndexStub({ value: 0 });

      const baseSlotOperations = SlotOperationsStub();
      const mockGetAvailableSlot = jest
        .fn(baseSlotOperations.getAvailableSlot)
        .mockReturnValueOnce(slotIndex);
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: mockGetAvailableSlot,
      });

      const questWithPendingStep = JSON.stringify({
        id: 'test-quest',
        folder: '001-test',
        title: 'Test Quest',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        contexts: [],
        observables: [],
        steps: [
          DependencyStepStub({
            id: stepId,
            status: 'pending',
            dependsOn: [],
          }),
        ],
        toolingRequirements: [],
      });

      const questWithInProgressStep = JSON.stringify({
        id: 'test-quest',
        folder: '001-test',
        title: 'Test Quest',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        contexts: [],
        observables: [],
        steps: [
          DependencyStepStub({
            id: stepId,
            status: 'in_progress',
            dependsOn: [],
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ],
        toolingRequirements: [],
      });

      const questWithCompleteStep = JSON.stringify({
        id: 'test-quest',
        folder: '001-test',
        title: 'Test Quest',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        contexts: [],
        observables: [],
        steps: [
          DependencyStepStub({
            id: stepId,
            status: 'complete',
            dependsOn: [],
            startedAt: '2024-01-15T10:00:00.000Z',
            completedAt: '2024-01-15T10:00:00.000Z',
          }),
        ],
        toolingRequirements: [],
      });

      proxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({
        content: questWithPendingStep,
      });
      proxy.loopProxy.questUpdateStepProxy.fsReadFileProxy.resolves({
        content: questWithPendingStep,
      });
      proxy.loopProxy.questUpdateStepProxy.fsReadFileProxy.resolves({
        content: questWithInProgressStep,
      });
      proxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({
        content: questWithCompleteStep,
      });

      proxy.loopProxy.spawnAgentProxy.agentSpawnProxy.setupSuccessNoSignal({
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const result = await runOrchestrationLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        activeAgents: [],
      });

      expect(result).toStrictEqual({ completed: true });
    });
  });

  describe('multi-iteration loop', () => {
    it('VALID: {3 sequential steps with dependencies} => executes all steps in order and returns completed', async () => {
      const proxy = runOrchestrationLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 1 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const stepId1 = StepIdStub({ value: 'aaaaaaaa-1111-1111-1111-111111111111' });
      const stepId2 = StepIdStub({ value: 'bbbbbbbb-2222-2222-2222-222222222222' });
      const stepId3 = StepIdStub({ value: 'cccccccc-3333-3333-3333-333333333333' });
      const slotIndex = SlotIndexStub({ value: 0 });

      const baseSlotOperations = SlotOperationsStub();
      const mockGetAvailableSlot = jest
        .fn(baseSlotOperations.getAvailableSlot)
        .mockReturnValueOnce(slotIndex)
        .mockReturnValueOnce(slotIndex)
        .mockReturnValueOnce(slotIndex);
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: mockGetAvailableSlot,
      });

      // Iteration 1: step1 pending, step2/step3 blocked by dependencies
      const questIter1 = JSON.stringify({
        id: 'test-quest',
        folder: '001-test',
        title: 'Test Quest',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        contexts: [],
        observables: [],
        steps: [
          DependencyStepStub({ id: stepId1, status: 'pending', dependsOn: [] }),
          DependencyStepStub({ id: stepId2, status: 'pending', dependsOn: [stepId1] }),
          DependencyStepStub({ id: stepId3, status: 'pending', dependsOn: [stepId2] }),
        ],
        toolingRequirements: [],
      });

      // step1 in progress
      const questIter1InProgress = JSON.stringify({
        id: 'test-quest',
        folder: '001-test',
        title: 'Test Quest',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        contexts: [],
        observables: [],
        steps: [
          DependencyStepStub({
            id: stepId1,
            status: 'in_progress',
            dependsOn: [],
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          DependencyStepStub({ id: stepId2, status: 'pending', dependsOn: [stepId1] }),
          DependencyStepStub({ id: stepId3, status: 'pending', dependsOn: [stepId2] }),
        ],
        toolingRequirements: [],
      });

      // Iteration 2: step1 complete, step2 ready
      const questIter2 = JSON.stringify({
        id: 'test-quest',
        folder: '001-test',
        title: 'Test Quest',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        contexts: [],
        observables: [],
        steps: [
          DependencyStepStub({
            id: stepId1,
            status: 'complete',
            dependsOn: [],
            startedAt: '2024-01-15T10:00:00.000Z',
            completedAt: '2024-01-15T10:00:00.000Z',
          }),
          DependencyStepStub({ id: stepId2, status: 'pending', dependsOn: [stepId1] }),
          DependencyStepStub({ id: stepId3, status: 'pending', dependsOn: [stepId2] }),
        ],
        toolingRequirements: [],
      });

      // step2 in progress
      const questIter2InProgress = JSON.stringify({
        id: 'test-quest',
        folder: '001-test',
        title: 'Test Quest',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        contexts: [],
        observables: [],
        steps: [
          DependencyStepStub({
            id: stepId1,
            status: 'complete',
            dependsOn: [],
            startedAt: '2024-01-15T10:00:00.000Z',
            completedAt: '2024-01-15T10:00:00.000Z',
          }),
          DependencyStepStub({
            id: stepId2,
            status: 'in_progress',
            dependsOn: [stepId1],
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          DependencyStepStub({ id: stepId3, status: 'pending', dependsOn: [stepId2] }),
        ],
        toolingRequirements: [],
      });

      // Iteration 3: step1 and step2 complete, step3 ready
      const questIter3 = JSON.stringify({
        id: 'test-quest',
        folder: '001-test',
        title: 'Test Quest',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        contexts: [],
        observables: [],
        steps: [
          DependencyStepStub({
            id: stepId1,
            status: 'complete',
            dependsOn: [],
            startedAt: '2024-01-15T10:00:00.000Z',
            completedAt: '2024-01-15T10:00:00.000Z',
          }),
          DependencyStepStub({
            id: stepId2,
            status: 'complete',
            dependsOn: [stepId1],
            startedAt: '2024-01-15T10:00:00.000Z',
            completedAt: '2024-01-15T10:00:00.000Z',
          }),
          DependencyStepStub({ id: stepId3, status: 'pending', dependsOn: [stepId2] }),
        ],
        toolingRequirements: [],
      });

      // step3 in progress
      const questIter3InProgress = JSON.stringify({
        id: 'test-quest',
        folder: '001-test',
        title: 'Test Quest',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        contexts: [],
        observables: [],
        steps: [
          DependencyStepStub({
            id: stepId1,
            status: 'complete',
            dependsOn: [],
            startedAt: '2024-01-15T10:00:00.000Z',
            completedAt: '2024-01-15T10:00:00.000Z',
          }),
          DependencyStepStub({
            id: stepId2,
            status: 'complete',
            dependsOn: [stepId1],
            startedAt: '2024-01-15T10:00:00.000Z',
            completedAt: '2024-01-15T10:00:00.000Z',
          }),
          DependencyStepStub({
            id: stepId3,
            status: 'in_progress',
            dependsOn: [stepId2],
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ],
        toolingRequirements: [],
      });

      // Final: all steps complete
      const questFinal = JSON.stringify({
        id: 'test-quest',
        folder: '001-test',
        title: 'Test Quest',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        contexts: [],
        observables: [],
        steps: [
          DependencyStepStub({
            id: stepId1,
            status: 'complete',
            dependsOn: [],
            startedAt: '2024-01-15T10:00:00.000Z',
            completedAt: '2024-01-15T10:00:00.000Z',
          }),
          DependencyStepStub({
            id: stepId2,
            status: 'complete',
            dependsOn: [stepId1],
            startedAt: '2024-01-15T10:00:00.000Z',
            completedAt: '2024-01-15T10:00:00.000Z',
          }),
          DependencyStepStub({
            id: stepId3,
            status: 'complete',
            dependsOn: [stepId2],
            startedAt: '2024-01-15T10:00:00.000Z',
            completedAt: '2024-01-15T10:00:00.000Z',
          }),
        ],
        toolingRequirements: [],
      });

      // Iteration 1: load quest, update step1 to in_progress, spawn agent, agent completes, update step1 to complete
      proxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({ content: questIter1 });
      proxy.loopProxy.questUpdateStepProxy.fsReadFileProxy.resolves({ content: questIter1 });
      proxy.loopProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();
      proxy.loopProxy.spawnAgentProxy.agentSpawnProxy.setupSuccessNoSignal({
        exitCode: ExitCodeStub({ value: 0 }),
      });
      proxy.loopProxy.questUpdateStepProxy.fsReadFileProxy.resolves({
        content: questIter1InProgress,
      });
      proxy.loopProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();

      // Iteration 2: load quest (step1 complete), update step2 to in_progress, spawn agent, agent completes, update step2 to complete
      proxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({ content: questIter2 });
      proxy.loopProxy.questUpdateStepProxy.fsReadFileProxy.resolves({ content: questIter2 });
      proxy.loopProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();
      proxy.loopProxy.spawnAgentProxy.agentSpawnProxy.setupSuccessNoSignal({
        exitCode: ExitCodeStub({ value: 0 }),
      });
      proxy.loopProxy.questUpdateStepProxy.fsReadFileProxy.resolves({
        content: questIter2InProgress,
      });
      proxy.loopProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();

      // Iteration 3: load quest (step1/step2 complete), update step3 to in_progress, spawn agent, agent completes, update step3 to complete
      proxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({ content: questIter3 });
      proxy.loopProxy.questUpdateStepProxy.fsReadFileProxy.resolves({ content: questIter3 });
      proxy.loopProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();
      proxy.loopProxy.spawnAgentProxy.agentSpawnProxy.setupSuccessNoSignal({
        exitCode: ExitCodeStub({ value: 0 }),
      });
      proxy.loopProxy.questUpdateStepProxy.fsReadFileProxy.resolves({
        content: questIter3InProgress,
      });
      proxy.loopProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();

      // Final iteration: load quest (all complete), return completed
      proxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({ content: questFinal });

      const result = await runOrchestrationLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        activeAgents: [],
      });

      expect(result).toStrictEqual({ completed: true });
    });
  });

  describe('signal handling within recursion', () => {
    it('VALID: {step sends complete signal then continues to next step} => handles signal and completes', async () => {
      const proxy = runOrchestrationLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 1 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const stepId1 = StepIdStub({ value: 'aaaaaaaa-1111-1111-1111-111111111111' });
      const stepId2 = StepIdStub({ value: 'bbbbbbbb-2222-2222-2222-222222222222' });
      const slotIndex = SlotIndexStub({ value: 0 });
      const sessionId = SessionIdStub({ value: 'session-123' });

      const baseSlotOperations = SlotOperationsStub();
      const mockGetAvailableSlot = jest
        .fn(baseSlotOperations.getAvailableSlot)
        .mockReturnValueOnce(undefined) // No slot initially (agent already exists)
        .mockReturnValueOnce(slotIndex); // Slot available for step2
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: mockGetAvailableSlot,
      });

      const signal = StreamSignalStub({
        signal: 'complete',
        stepId: stepId1,
        summary: 'Step 1 done' as never,
      });

      // step1 in progress (agent is running)
      const questIter1InProgress = JSON.stringify({
        id: 'test-quest',
        folder: '001-test',
        title: 'Test Quest',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        contexts: [],
        observables: [],
        steps: [
          DependencyStepStub({
            id: stepId1,
            status: 'in_progress',
            dependsOn: [],
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          DependencyStepStub({ id: stepId2, status: 'pending', dependsOn: [stepId1] }),
        ],
        toolingRequirements: [],
      });

      // After step1 complete signal handled
      const questIter2 = JSON.stringify({
        id: 'test-quest',
        folder: '001-test',
        title: 'Test Quest',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        contexts: [],
        observables: [],
        steps: [
          DependencyStepStub({
            id: stepId1,
            status: 'complete',
            dependsOn: [],
            startedAt: '2024-01-15T10:00:00.000Z',
            completedAt: '2024-01-15T10:00:00.000Z',
          }),
          DependencyStepStub({ id: stepId2, status: 'pending', dependsOn: [stepId1] }),
        ],
        toolingRequirements: [],
      });

      const questIter2InProgress = JSON.stringify({
        id: 'test-quest',
        folder: '001-test',
        title: 'Test Quest',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        contexts: [],
        observables: [],
        steps: [
          DependencyStepStub({
            id: stepId1,
            status: 'complete',
            dependsOn: [],
            startedAt: '2024-01-15T10:00:00.000Z',
            completedAt: '2024-01-15T10:00:00.000Z',
          }),
          DependencyStepStub({
            id: stepId2,
            status: 'in_progress',
            dependsOn: [stepId1],
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ],
        toolingRequirements: [],
      });

      // Final: all complete
      const questFinal = JSON.stringify({
        id: 'test-quest',
        folder: '001-test',
        title: 'Test Quest',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        contexts: [],
        observables: [],
        steps: [
          DependencyStepStub({
            id: stepId1,
            status: 'complete',
            dependsOn: [],
            startedAt: '2024-01-15T10:00:00.000Z',
            completedAt: '2024-01-15T10:00:00.000Z',
          }),
          DependencyStepStub({
            id: stepId2,
            status: 'complete',
            dependsOn: [stepId1],
            startedAt: '2024-01-15T10:00:00.000Z',
            completedAt: '2024-01-15T10:00:00.000Z',
          }),
        ],
        toolingRequirements: [],
      });

      // Setup agent to return a complete signal
      const signalResult = AgentSpawnStreamingResultStub({
        sessionId,
        crashed: false as never,
        timedOut: false as never,
        signal,
      });
      const activeAgentStep1: ActiveAgent = ActiveAgentStub({
        slotIndex,
        stepId: stepId1,
        sessionId,
        promise: Promise.resolve(signalResult),
      });

      // Iteration 1: load quest (step1 in_progress), agent completes with signal
      proxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({ content: questIter1InProgress });

      // handleSignal updates step to complete
      proxy.loopProxy.handleSignalProxy.questUpdateStepProxy.fsReadFileProxy.resolves({
        content: questIter1InProgress,
      });
      proxy.loopProxy.handleSignalProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();

      // Iteration 2: load quest (step1 complete), spawn step2, agent completes with no signal
      proxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({ content: questIter2 });
      proxy.loopProxy.questUpdateStepProxy.fsReadFileProxy.resolves({ content: questIter2 });
      proxy.loopProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();
      proxy.loopProxy.spawnAgentProxy.agentSpawnProxy.setupSuccessNoSignal({
        exitCode: ExitCodeStub({ value: 0 }),
      });
      // After agent completes, update step2 to complete
      proxy.loopProxy.questUpdateStepProxy.fsReadFileProxy.resolves({
        content: questIter2InProgress,
      });
      proxy.loopProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();

      // Final iteration: all complete
      proxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({ content: questFinal });

      const result = await runOrchestrationLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        activeAgents: [activeAgentStep1],
      });

      expect(result).toStrictEqual({ completed: true });
    });

    it('VALID: {step sends partially-complete signal} => respawns and continues to completion', async () => {
      const proxy = runOrchestrationLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 1 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const stepId = StepIdStub({ value: 'aaaaaaaa-1111-1111-1111-111111111111' });
      const slotIndex = SlotIndexStub({ value: 0 });
      const newSlotIndex = SlotIndexStub({ value: 0 });
      const sessionId = SessionIdStub({ value: 'session-123' });

      const baseSlotOperations = SlotOperationsStub();
      const mockGetAvailableSlot = jest
        .fn(baseSlotOperations.getAvailableSlot)
        .mockReturnValueOnce(undefined) // No slot initially (for race)
        .mockReturnValueOnce(newSlotIndex) // Slot available for respawn
        .mockReturnValueOnce(undefined); // No new slot in next iteration
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: mockGetAvailableSlot,
      });

      const partialSignal = StreamSignalStub({
        signal: 'partially-complete',
        stepId,
        progress: 'Made some progress' as never,
        continuationPoint: 'Continue from checkpoint' as never,
      });

      const questInProgress = JSON.stringify({
        id: 'test-quest',
        folder: '001-test',
        title: 'Test Quest',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        contexts: [],
        observables: [],
        steps: [
          DependencyStepStub({
            id: stepId,
            status: 'in_progress',
            dependsOn: [],
            name: 'Test Step',
            description: 'Test Description',
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ],
        toolingRequirements: [],
      });

      const questPartiallyComplete = JSON.stringify({
        id: 'test-quest',
        folder: '001-test',
        title: 'Test Quest',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        contexts: [],
        observables: [],
        steps: [
          DependencyStepStub({
            id: stepId,
            status: 'partially_complete',
            dependsOn: [],
            name: 'Test Step',
            description: 'Test Description',
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ],
        toolingRequirements: [],
      });

      const questComplete = JSON.stringify({
        id: 'test-quest',
        folder: '001-test',
        title: 'Test Quest',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        contexts: [],
        observables: [],
        steps: [
          DependencyStepStub({
            id: stepId,
            status: 'complete',
            dependsOn: [],
            startedAt: '2024-01-15T10:00:00.000Z',
            completedAt: '2024-01-15T10:00:00.000Z',
          }),
        ],
        toolingRequirements: [],
      });

      const partialResult = AgentSpawnStreamingResultStub({
        sessionId,
        crashed: false as never,
        timedOut: false as never,
        signal: partialSignal,
      });

      const activeAgent: ActiveAgent = ActiveAgentStub({
        slotIndex,
        stepId,
        sessionId,
        promise: Promise.resolve(partialResult),
      });

      // Iteration 1: load quest (in_progress), agent sends partially-complete
      proxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({ content: questInProgress });
      proxy.loopProxy.handleSignalProxy.questUpdateStepProxy.fsReadFileProxy.resolves({
        content: questInProgress,
      });
      proxy.loopProxy.handleSignalProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();
      // Load quest again to find step for respawn
      proxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({
        content: questPartiallyComplete,
      });

      // Iteration 2: respawned agent runs, no new steps to spawn
      proxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({
        content: questPartiallyComplete,
      });

      // Respawned agent completes successfully
      proxy.loopProxy.spawnAgentProxy.agentSpawnProxy.setupSuccessNoSignal({
        exitCode: ExitCodeStub({ value: 0 }),
      });
      // After agent completes, update step to complete
      proxy.loopProxy.questUpdateStepProxy.fsReadFileProxy.resolves({
        content: questPartiallyComplete,
      });
      proxy.loopProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();

      // Final iteration: all complete
      proxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({ content: questComplete });

      const result = await runOrchestrationLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        activeAgents: [activeAgent],
      });

      expect(result).toStrictEqual({ completed: true });
    });
  });

  describe('crash recovery within recursion', () => {
    it('VALID: {agent crashes then recovers on retry} => respawns and completes', async () => {
      const proxy = runOrchestrationLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 1 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const stepId = StepIdStub({ value: 'aaaaaaaa-1111-1111-1111-111111111111' });
      const slotIndex = SlotIndexStub({ value: 0 });
      const newSlotIndex = SlotIndexStub({ value: 0 });
      const sessionId = SessionIdStub({ value: 'session-123' });

      const baseSlotOperations = SlotOperationsStub();
      const mockGetAvailableSlot = jest
        .fn(baseSlotOperations.getAvailableSlot)
        .mockReturnValueOnce(undefined) // No slot initially (for race)
        .mockReturnValueOnce(newSlotIndex) // Slot available for respawn
        .mockReturnValueOnce(undefined); // No new slot in next iteration
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: mockGetAvailableSlot,
      });

      const questInProgress = JSON.stringify({
        id: 'test-quest',
        folder: '001-test',
        title: 'Test Quest',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        contexts: [],
        observables: [],
        steps: [
          DependencyStepStub({
            id: stepId,
            status: 'in_progress',
            dependsOn: [],
            name: 'Test Step',
            description: 'Test Description',
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ],
        toolingRequirements: [],
      });

      const questComplete = JSON.stringify({
        id: 'test-quest',
        folder: '001-test',
        title: 'Test Quest',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        contexts: [],
        observables: [],
        steps: [
          DependencyStepStub({
            id: stepId,
            status: 'complete',
            dependsOn: [],
            startedAt: '2024-01-15T10:00:00.000Z',
            completedAt: '2024-01-15T10:00:00.000Z',
          }),
        ],
        toolingRequirements: [],
      });

      const crashResult = AgentSpawnStreamingResultStub({
        sessionId,
        crashed: true as never,
        timedOut: false as never,
        signal: null,
      });

      const activeAgent: ActiveAgent = ActiveAgentStub({
        slotIndex,
        stepId,
        sessionId,
        promise: Promise.resolve(crashResult),
      });

      // Iteration 1: load quest (in_progress), agent crashes
      proxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({ content: questInProgress });
      // Load quest again to find step for respawn
      proxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({ content: questInProgress });

      // Iteration 2: respawned agent runs, no new steps to spawn
      proxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({ content: questInProgress });

      // Respawned agent completes successfully
      proxy.loopProxy.spawnAgentProxy.agentSpawnProxy.setupSuccessNoSignal({
        exitCode: ExitCodeStub({ value: 0 }),
      });
      // After agent completes, update step to complete
      proxy.loopProxy.questUpdateStepProxy.fsReadFileProxy.resolves({ content: questInProgress });
      proxy.loopProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();

      // Final iteration: all complete
      proxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({ content: questComplete });

      const result = await runOrchestrationLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        activeAgents: [activeAgent],
      });

      expect(result).toStrictEqual({ completed: true });
    });

    it('VALID: {agent times out then recovers on retry} => respawns without session and completes', async () => {
      const proxy = runOrchestrationLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 1 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const stepId = StepIdStub({ value: 'aaaaaaaa-1111-1111-1111-111111111111' });
      const slotIndex = SlotIndexStub({ value: 0 });
      const newSlotIndex = SlotIndexStub({ value: 0 });

      const baseSlotOperations = SlotOperationsStub();
      const mockGetAvailableSlot = jest
        .fn(baseSlotOperations.getAvailableSlot)
        .mockReturnValueOnce(undefined) // No slot initially (for race)
        .mockReturnValueOnce(newSlotIndex) // Slot available for respawn
        .mockReturnValueOnce(undefined); // No new slot in next iteration
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: mockGetAvailableSlot,
      });

      const questInProgress = JSON.stringify({
        id: 'test-quest',
        folder: '001-test',
        title: 'Test Quest',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        contexts: [],
        observables: [],
        steps: [
          DependencyStepStub({
            id: stepId,
            status: 'in_progress',
            dependsOn: [],
            name: 'Test Step',
            description: 'Test Description',
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ],
        toolingRequirements: [],
      });

      const questComplete = JSON.stringify({
        id: 'test-quest',
        folder: '001-test',
        title: 'Test Quest',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        contexts: [],
        observables: [],
        steps: [
          DependencyStepStub({
            id: stepId,
            status: 'complete',
            dependsOn: [],
            startedAt: '2024-01-15T10:00:00.000Z',
            completedAt: '2024-01-15T10:00:00.000Z',
          }),
        ],
        toolingRequirements: [],
      });

      const timeoutResult = AgentSpawnStreamingResultStub({
        sessionId: null,
        crashed: false as never,
        timedOut: true as never,
        signal: null,
      });

      const activeAgent: ActiveAgent = ActiveAgentStub({
        slotIndex,
        stepId,
        sessionId: null,
        promise: Promise.resolve(timeoutResult),
      });

      // Iteration 1: load quest (in_progress), agent times out
      proxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({ content: questInProgress });
      // Load quest again to find step for respawn
      proxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({ content: questInProgress });

      // Iteration 2: respawned agent runs, no new steps to spawn
      proxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({ content: questInProgress });

      // Respawned agent completes successfully
      proxy.loopProxy.spawnAgentProxy.agentSpawnProxy.setupSuccessNoSignal({
        exitCode: ExitCodeStub({ value: 0 }),
      });
      // After agent completes, update step to complete
      proxy.loopProxy.questUpdateStepProxy.fsReadFileProxy.resolves({ content: questInProgress });
      proxy.loopProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();

      // Final iteration: all complete
      proxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({ content: questComplete });

      const result = await runOrchestrationLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        activeAgents: [activeAgent],
      });

      expect(result).toStrictEqual({ completed: true });
    });
  });
});
