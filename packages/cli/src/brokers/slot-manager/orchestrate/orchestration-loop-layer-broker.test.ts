import {
  DependencyStepStub,
  ExitCodeStub,
  FilePathStub,
  SessionIdStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';

import { ActiveAgentStub } from '../../../contracts/active-agent/active-agent.stub';
import { AgentRoleStub } from '../../../contracts/agent-role/agent-role.stub';
import { AgentSpawnStreamingResultStub } from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result.stub';
import { SlotCountStub } from '../../../contracts/slot-count/slot-count.stub';
import { SlotIndexStub } from '../../../contracts/slot-index/slot-index.stub';
import { SlotOperationsStub } from '../../../contracts/slot-operations/slot-operations.stub';
import { StreamSignalStub } from '../../../contracts/stream-signal/stream-signal.stub';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';
import { orchestrationLoopLayerBroker } from './orchestration-loop-layer-broker';
import { orchestrationLoopLayerBrokerProxy } from './orchestration-loop-layer-broker.proxy';

type ActiveAgent = ReturnType<typeof ActiveAgentStub>;

describe('orchestrationLoopLayerBroker', () => {
  describe('all steps complete', () => {
    it('VALID: {all steps complete, no active agents} => returns done with completed true', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();

      proxy.questLoadProxy.fsReadFileProxy.resolves({
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

      const result = await orchestrationLoopLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
        activeAgents: [],
      });

      expect(result).toStrictEqual({ done: true, result: { completed: true } });
    });
  });

  describe('no ready steps and no active agents', () => {
    it('VALID: {no ready steps, no active agents, no available slots} => returns done with completed true', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: () => undefined,
      });

      const stepId1 = StepIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const stepId2 = StepIdStub({ value: 'ffffffff-1111-2222-3333-444444444444' });

      proxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify({
          id: 'test-quest',
          folder: '001-test',
          title: 'Test Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          contexts: [],
          observables: [],
          steps: [
            DependencyStepStub({ id: stepId1, status: 'in_progress' }),
            DependencyStepStub({ id: stepId2, status: 'pending', dependsOn: [stepId1] }),
          ],
          toolingRequirements: [],
        }),
      });

      const result = await orchestrationLoopLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
        activeAgents: [],
      });

      expect(result).toStrictEqual({ done: true, result: { completed: true } });
    });

    it('VALID: {no ready steps due to dependencies, has available slot, no active agents} => returns done', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();

      const stepId1 = StepIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const stepId2 = StepIdStub({ value: 'ffffffff-1111-2222-3333-444444444444' });

      proxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify({
          id: 'test-quest',
          folder: '001-test',
          title: 'Test Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          contexts: [],
          observables: [],
          steps: [
            DependencyStepStub({ id: stepId1, status: 'in_progress' }),
            DependencyStepStub({ id: stepId2, status: 'pending', dependsOn: [stepId1] }),
          ],
          toolingRequirements: [],
        }),
      });

      const result = await orchestrationLoopLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
        activeAgents: [],
      });

      expect(result).toStrictEqual({ done: true, result: { completed: true } });
    });
  });

  describe('spawning agent for ready step', () => {
    it('VALID: {ready step, available slot} => spawns agent and continues with active agent', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const stepId = StepIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const existingStepId = StepIdStub({ value: 'ffffffff-1111-2222-3333-444444444444' });
      const slotIndex = SlotIndexStub({ value: 0 });
      const existingSlotIndex = SlotIndexStub({ value: 1 });
      const existingSessionId = SessionIdStub({ value: 'existing-session' });
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: () => slotIndex,
      });

      proxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify({
          id: 'test-quest',
          folder: '001-test',
          title: 'Test Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          contexts: [],
          observables: [],
          steps: [
            DependencyStepStub({ id: stepId, status: 'pending', dependsOn: [] }),
            DependencyStepStub({ id: existingStepId, status: 'in_progress', dependsOn: [] }),
          ],
          toolingRequirements: [],
        }),
      });

      proxy.questUpdateStepProxy.fsReadFileProxy.resolves({
        content: JSON.stringify({
          id: 'test-quest',
          folder: '001-test',
          title: 'Test Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          contexts: [],
          observables: [],
          steps: [
            DependencyStepStub({ id: stepId, status: 'in_progress', dependsOn: [] }),
            DependencyStepStub({ id: existingStepId, status: 'in_progress', dependsOn: [] }),
          ],
          toolingRequirements: [],
        }),
      });
      proxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();
      proxy.questUpdateStepProxy.fsReadFileProxy.resolves({
        content: JSON.stringify({
          id: 'test-quest',
          folder: '001-test',
          title: 'Test Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          contexts: [],
          observables: [],
          steps: [
            DependencyStepStub({ id: stepId, status: 'in_progress', dependsOn: [] }),
            DependencyStepStub({ id: existingStepId, status: 'in_progress', dependsOn: [] }),
          ],
          toolingRequirements: [],
        }),
      });
      proxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();

      proxy.spawnAgentProxy.agentSpawnByRoleProxy.setupCodeweaverSuccess({
        exitCode: ExitCodeStub({ value: 0 }),
      });

      // Start with an existing active agent that never completes
      const activeAgents: ActiveAgent[] = [
        ActiveAgentStub({
          slotIndex: existingSlotIndex,
          stepId: existingStepId,
          sessionId: existingSessionId,
          promise: new Promise(() => {}), // Never resolves
        }),
      ];

      const result = await orchestrationLoopLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
        activeAgents,
      });

      // The newly spawned agent completes first (via Promise.race), gets removed.
      // The existing agent that never completes remains in activeAgents.
      expect(result).toStrictEqual({
        done: false,
        activeAgents: [
          {
            slotIndex: existingSlotIndex,
            stepId: existingStepId,
            sessionId: existingSessionId,
            promise: expect.any(Promise),
          },
        ],
      });
    });
  });

  describe('agent completes with no signal', () => {
    it('VALID: {active agent completes, signal is null} => updates step to complete and continues', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const stepId = StepIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const slotIndex = SlotIndexStub({ value: 0 });
      const sessionId = SessionIdStub({ value: 'session-123' });
      const releaseSlotSpy = jest.fn(() => true);
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: () => undefined,
        releaseSlot: releaseSlotSpy,
      });

      const spawnResult = AgentSpawnStreamingResultStub({
        sessionId,
        crashed: false as never,
        timedOut: false as never,
        signal: null,
      });

      proxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify({
          id: 'test-quest',
          folder: '001-test',
          title: 'Test Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          contexts: [],
          observables: [],
          steps: [DependencyStepStub({ id: stepId, status: 'in_progress' })],
          toolingRequirements: [],
        }),
      });

      proxy.questUpdateStepProxy.fsReadFileProxy.resolves({
        content: JSON.stringify({
          id: 'test-quest',
          folder: '001-test',
          title: 'Test Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          contexts: [],
          observables: [],
          steps: [DependencyStepStub({ id: stepId, status: 'in_progress' })],
          toolingRequirements: [],
        }),
      });
      proxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();

      const activeAgents: ActiveAgent[] = [
        ActiveAgentStub({
          slotIndex,
          stepId,
          sessionId,
          promise: Promise.resolve(spawnResult),
        }),
      ];

      const result = await orchestrationLoopLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
        activeAgents,
      });

      expect(result).toStrictEqual({ done: false, activeAgents: [] });
      expect(releaseSlotSpy).toHaveBeenCalledWith({ slotIndex });
    });
  });

  describe('agent crashes or times out', () => {
    it('VALID: {agent crashed, slot available, step found} => respawns agent with resume session', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const stepId = StepIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const slotIndex = SlotIndexStub({ value: 0 });
      const newSlotIndex = SlotIndexStub({ value: 1 });
      const sessionId = SessionIdStub({ value: 'session-123' });
      const releaseSlotSpy = jest.fn(() => true);
      const getAvailableSlotMock = jest
        .fn()
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(newSlotIndex);
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: getAvailableSlotMock,
        releaseSlot: releaseSlotSpy,
      });

      const crashResult = AgentSpawnStreamingResultStub({
        sessionId,
        crashed: true as never,
        timedOut: false as never,
        signal: null,
      });

      const questJson = JSON.stringify({
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
            name: 'Test Step',
            description: 'Test Description',
          }),
        ],
        toolingRequirements: [],
      });
      proxy.questLoadProxy.fsReadFileProxy.resolves({ content: questJson });
      proxy.questLoadProxy.fsReadFileProxy.resolves({ content: questJson });

      proxy.questUpdateStepProxy.fsReadFileProxy.resolves({ content: questJson });
      proxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();
      proxy.questUpdateStepProxy.fsReadFileProxy.resolves({ content: questJson });
      proxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();

      proxy.spawnAgentProxy.agentSpawnByRoleProxy.setupCodeweaverSuccess({
        exitCode: ExitCodeStub({ value: 0 }),
      });
      proxy.spawnAgentProxy.agentSpawnByRoleProxy.setupCodeweaverSuccess({
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const activeAgents: ActiveAgent[] = [
        ActiveAgentStub({
          slotIndex,
          stepId,
          sessionId,
          promise: Promise.resolve(crashResult),
        }),
      ];

      const result = await orchestrationLoopLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
        activeAgents,
      });

      expect(result).toStrictEqual({
        done: false,
        activeAgents: [
          {
            slotIndex: newSlotIndex,
            stepId,
            sessionId,
            promise: expect.any(Promise),
          },
        ],
      });
      expect(releaseSlotSpy).toHaveBeenCalledWith({ slotIndex });
    });

    it('VALID: {agent timed out, slot available, step found, no session} => respawns agent without resume', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const stepId = StepIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const slotIndex = SlotIndexStub({ value: 0 });
      const newSlotIndex = SlotIndexStub({ value: 1 });
      const releaseSlotSpy = jest.fn(() => true);
      const getAvailableSlotMock = jest
        .fn()
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(newSlotIndex);
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: getAvailableSlotMock,
        releaseSlot: releaseSlotSpy,
      });

      const timeoutResult = AgentSpawnStreamingResultStub({
        sessionId: null,
        crashed: false as never,
        timedOut: true as never,
        signal: null,
      });

      const questJson = JSON.stringify({
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
            name: 'Test Step',
            description: 'Test Description',
          }),
        ],
        toolingRequirements: [],
      });
      proxy.questLoadProxy.fsReadFileProxy.resolves({ content: questJson });
      proxy.questLoadProxy.fsReadFileProxy.resolves({ content: questJson });

      proxy.questUpdateStepProxy.fsReadFileProxy.resolves({ content: questJson });
      proxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();
      proxy.questUpdateStepProxy.fsReadFileProxy.resolves({ content: questJson });
      proxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();

      proxy.spawnAgentProxy.agentSpawnByRoleProxy.setupCodeweaverSuccess({
        exitCode: ExitCodeStub({ value: 0 }),
      });
      proxy.spawnAgentProxy.agentSpawnByRoleProxy.setupCodeweaverSuccess({
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const activeAgents: ActiveAgent[] = [
        ActiveAgentStub({
          slotIndex,
          stepId,
          sessionId: null,
          promise: Promise.resolve(timeoutResult),
        }),
      ];

      const result = await orchestrationLoopLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
        activeAgents,
      });

      expect(result).toStrictEqual({
        done: false,
        activeAgents: [
          {
            slotIndex: newSlotIndex,
            stepId,
            sessionId: null,
            promise: expect.any(Promise),
          },
        ],
      });
    });

    it('VALID: {agent crashed, no available slot} => continues without respawning', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const stepId = StepIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const slotIndex = SlotIndexStub({ value: 0 });
      const sessionId = SessionIdStub({ value: 'session-123' });
      const releaseSlotSpy = jest.fn(() => true);
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: () => undefined,
        releaseSlot: releaseSlotSpy,
      });

      const crashResult = AgentSpawnStreamingResultStub({
        sessionId,
        crashed: true as never,
        timedOut: false as never,
        signal: null,
      });

      const questJson = JSON.stringify({
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
            name: 'Test Step',
            description: 'Test Description',
          }),
        ],
        toolingRequirements: [],
      });
      proxy.questLoadProxy.fsReadFileProxy.resolves({ content: questJson });
      proxy.questLoadProxy.fsReadFileProxy.resolves({ content: questJson });

      const activeAgents: ActiveAgent[] = [
        ActiveAgentStub({
          slotIndex,
          stepId,
          sessionId,
          promise: Promise.resolve(crashResult),
        }),
      ];

      const result = await orchestrationLoopLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
        activeAgents,
      });

      expect(result).toStrictEqual({ done: false, activeAgents: [] });
    });

    it('VALID: {agent crashed, step not found in quest} => continues without respawning', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const stepId = StepIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const otherStepId = StepIdStub({ value: 'ffffffff-1111-2222-3333-444444444444' });
      const slotIndex = SlotIndexStub({ value: 0 });
      const sessionId = SessionIdStub({ value: 'session-123' });
      const releaseSlotSpy = jest.fn(() => true);
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: () => SlotIndexStub({ value: 1 }),
        releaseSlot: releaseSlotSpy,
      });

      const crashResult = AgentSpawnStreamingResultStub({
        sessionId,
        crashed: true as never,
        timedOut: false as never,
        signal: null,
      });

      const questJson = JSON.stringify({
        id: 'test-quest',
        folder: '001-test',
        title: 'Test Quest',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        contexts: [],
        observables: [],
        steps: [DependencyStepStub({ id: otherStepId, status: 'in_progress' })],
        toolingRequirements: [],
      });
      proxy.questLoadProxy.fsReadFileProxy.resolves({ content: questJson });
      proxy.questLoadProxy.fsReadFileProxy.resolves({ content: questJson });

      const activeAgents: ActiveAgent[] = [
        ActiveAgentStub({
          slotIndex,
          stepId,
          sessionId,
          promise: Promise.resolve(crashResult),
        }),
      ];

      const result = await orchestrationLoopLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
        activeAgents,
      });

      expect(result).toStrictEqual({ done: false, activeAgents: [] });
    });
  });

  describe('agent completes with signal - complete', () => {
    it('VALID: {signal: complete} => continues orchestration', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const stepId = StepIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const slotIndex = SlotIndexStub({ value: 0 });
      const sessionId = SessionIdStub({ value: 'session-123' });
      const releaseSlotSpy = jest.fn(() => true);
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: () => undefined,
        releaseSlot: releaseSlotSpy,
      });

      const signal = StreamSignalStub({ signal: 'complete', stepId, summary: 'Done' as never });
      const signalResult = AgentSpawnStreamingResultStub({
        sessionId,
        crashed: false as never,
        timedOut: false as never,
        signal,
      });

      proxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify({
          id: 'test-quest',
          folder: '001-test',
          title: 'Test Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          contexts: [],
          observables: [],
          steps: [DependencyStepStub({ id: stepId, status: 'in_progress' })],
          toolingRequirements: [],
        }),
      });

      proxy.handleSignalProxy.questUpdateStepProxy.fsReadFileProxy.resolves({
        content: JSON.stringify({
          id: 'test-quest',
          folder: '001-test',
          title: 'Test Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          contexts: [],
          observables: [],
          steps: [DependencyStepStub({ id: stepId, status: 'in_progress' })],
          toolingRequirements: [],
        }),
      });
      proxy.handleSignalProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();

      const activeAgents: ActiveAgent[] = [
        ActiveAgentStub({
          slotIndex,
          stepId,
          sessionId,
          promise: Promise.resolve(signalResult),
        }),
      ];

      const result = await orchestrationLoopLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
        activeAgents,
      });

      expect(result).toStrictEqual({ done: false, activeAgents: [] });
    });
  });

  describe('agent completes with signal - needs-user-input', () => {
    it('VALID: {signal: needs-user-input} => returns with userInputNeeded', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const stepId = StepIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const slotIndex = SlotIndexStub({ value: 0 });
      const sessionId = SessionIdStub({ value: 'session-123' });
      const releaseSlotSpy = jest.fn(() => true);
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: () => undefined,
        releaseSlot: releaseSlotSpy,
      });

      const signal = StreamSignalStub({
        signal: 'needs-user-input',
        stepId,
        question: 'What is your name?' as never,
        context: 'User registration' as never,
      });
      const signalResult = AgentSpawnStreamingResultStub({
        sessionId,
        crashed: false as never,
        timedOut: false as never,
        signal,
      });

      proxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify({
          id: 'test-quest',
          folder: '001-test',
          title: 'Test Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          contexts: [],
          observables: [],
          steps: [DependencyStepStub({ id: stepId, status: 'in_progress' })],
          toolingRequirements: [],
        }),
      });

      proxy.handleSignalProxy.questUpdateStepProxy.fsReadFileProxy.resolves({
        content: JSON.stringify({
          id: 'test-quest',
          folder: '001-test',
          title: 'Test Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          contexts: [],
          observables: [],
          steps: [DependencyStepStub({ id: stepId, status: 'in_progress' })],
          toolingRequirements: [],
        }),
      });
      proxy.handleSignalProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();

      const activeAgents: ActiveAgent[] = [
        ActiveAgentStub({
          slotIndex,
          stepId,
          sessionId,
          promise: Promise.resolve(signalResult),
        }),
      ];

      const result = await orchestrationLoopLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
        activeAgents,
      });

      expect(result).toStrictEqual({
        done: true,
        result: {
          completed: false,
          userInputNeeded: {
            stepId,
            question: 'What is your name?',
            context: 'User registration',
          },
        },
      });
    });
  });

  describe('agent completes with signal - partially-complete', () => {
    it('VALID: {signal: partially-complete, slot available, step found, has continuationPoint} => respawns with continuation', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const stepId = StepIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const slotIndex = SlotIndexStub({ value: 0 });
      const newSlotIndex = SlotIndexStub({ value: 1 });
      const sessionId = SessionIdStub({ value: 'session-123' });
      const releaseSlotSpy = jest.fn(() => true);
      const getAvailableSlotMock = jest
        .fn()
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(newSlotIndex);
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: getAvailableSlotMock,
        releaseSlot: releaseSlotSpy,
      });

      const signal = StreamSignalStub({
        signal: 'partially-complete',
        stepId,
        progress: 'Made some progress' as never,
        continuationPoint: 'Continue from step 3' as never,
      });
      const signalResult = AgentSpawnStreamingResultStub({
        sessionId,
        crashed: false as never,
        timedOut: false as never,
        signal,
      });

      const questJson = JSON.stringify({
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
            name: 'Test Step',
            description: 'Test Description',
          }),
        ],
        toolingRequirements: [],
      });
      proxy.questLoadProxy.fsReadFileProxy.resolves({ content: questJson });
      proxy.questLoadProxy.fsReadFileProxy.resolves({ content: questJson });

      proxy.handleSignalProxy.questUpdateStepProxy.fsReadFileProxy.resolves({ content: questJson });
      proxy.handleSignalProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();

      proxy.questUpdateStepProxy.fsReadFileProxy.resolves({ content: questJson });
      proxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();

      proxy.spawnAgentProxy.agentSpawnByRoleProxy.setupCodeweaverSuccess({
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const activeAgents: ActiveAgent[] = [
        ActiveAgentStub({
          slotIndex,
          stepId,
          sessionId,
          promise: Promise.resolve(signalResult),
        }),
      ];

      const result = await orchestrationLoopLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
        activeAgents,
      });

      expect(result).toStrictEqual({
        done: false,
        activeAgents: [
          {
            slotIndex: newSlotIndex,
            stepId,
            sessionId,
            promise: expect.any(Promise),
          },
        ],
      });
    });

    it('VALID: {signal: partially-complete, no continuationPoint} => respawns with default message', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const stepId = StepIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const slotIndex = SlotIndexStub({ value: 0 });
      const newSlotIndex = SlotIndexStub({ value: 1 });
      const sessionId = SessionIdStub({ value: 'session-123' });
      const releaseSlotSpy = jest.fn(() => true);
      const getAvailableSlotMock = jest
        .fn()
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(newSlotIndex);
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: getAvailableSlotMock,
        releaseSlot: releaseSlotSpy,
      });

      const signal = StreamSignalStub({
        signal: 'partially-complete',
        stepId,
        progress: 'Made some progress' as never,
      });
      const signalResult = AgentSpawnStreamingResultStub({
        sessionId,
        crashed: false as never,
        timedOut: false as never,
        signal,
      });

      const questJson = JSON.stringify({
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
            name: 'Test Step',
            description: 'Test Description',
          }),
        ],
        toolingRequirements: [],
      });
      proxy.questLoadProxy.fsReadFileProxy.resolves({ content: questJson });
      proxy.questLoadProxy.fsReadFileProxy.resolves({ content: questJson });

      proxy.handleSignalProxy.questUpdateStepProxy.fsReadFileProxy.resolves({ content: questJson });
      proxy.handleSignalProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();

      proxy.questUpdateStepProxy.fsReadFileProxy.resolves({ content: questJson });
      proxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();

      proxy.spawnAgentProxy.agentSpawnByRoleProxy.setupCodeweaverSuccess({
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const activeAgents: ActiveAgent[] = [
        ActiveAgentStub({
          slotIndex,
          stepId,
          sessionId,
          promise: Promise.resolve(signalResult),
        }),
      ];

      const result = await orchestrationLoopLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
        activeAgents,
      });

      expect(result).toStrictEqual({
        done: false,
        activeAgents: [
          {
            slotIndex: newSlotIndex,
            stepId,
            sessionId,
            promise: expect.any(Promise),
          },
        ],
      });
    });

    it('VALID: {signal: partially-complete, no slot available} => continues without respawn', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const stepId = StepIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const slotIndex = SlotIndexStub({ value: 0 });
      const sessionId = SessionIdStub({ value: 'session-123' });
      const releaseSlotSpy = jest.fn(() => true);
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: () => undefined,
        releaseSlot: releaseSlotSpy,
      });

      const signal = StreamSignalStub({
        signal: 'partially-complete',
        stepId,
        progress: 'Made some progress' as never,
      });
      const signalResult = AgentSpawnStreamingResultStub({
        sessionId,
        crashed: false as never,
        timedOut: false as never,
        signal,
      });

      const questJson = JSON.stringify({
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
            name: 'Test Step',
            description: 'Test Description',
          }),
        ],
        toolingRequirements: [],
      });

      proxy.questLoadProxy.fsReadFileProxy.resolves({ content: questJson });
      proxy.questLoadProxy.fsReadFileProxy.resolves({ content: questJson });

      proxy.handleSignalProxy.questUpdateStepProxy.fsReadFileProxy.resolves({
        content: questJson,
      });
      proxy.handleSignalProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();

      const activeAgents: ActiveAgent[] = [
        ActiveAgentStub({
          slotIndex,
          stepId,
          sessionId,
          promise: Promise.resolve(signalResult),
        }),
      ];

      const result = await orchestrationLoopLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
        activeAgents,
      });

      expect(result).toStrictEqual({ done: false, activeAgents: [] });
    });

    it('VALID: {signal: partially-complete, step not found in quest3} => continues without respawn', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const stepId = StepIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const otherStepId = StepIdStub({ value: 'ffffffff-1111-2222-3333-444444444444' });
      const slotIndex = SlotIndexStub({ value: 0 });
      const sessionId = SessionIdStub({ value: 'session-123' });
      const releaseSlotSpy = jest.fn(() => true);
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: () => SlotIndexStub({ value: 1 }),
        releaseSlot: releaseSlotSpy,
      });

      const signal = StreamSignalStub({
        signal: 'partially-complete',
        stepId,
        progress: 'Made some progress' as never,
      });
      const signalResult = AgentSpawnStreamingResultStub({
        sessionId,
        crashed: false as never,
        timedOut: false as never,
        signal,
      });

      const questJsonWithStep = JSON.stringify({
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
            name: 'Test Step',
            description: 'Test Description',
          }),
        ],
        toolingRequirements: [],
      });

      const questJsonWithoutStep = JSON.stringify({
        id: 'test-quest',
        folder: '001-test',
        title: 'Test Quest',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        contexts: [],
        observables: [],
        steps: [DependencyStepStub({ id: otherStepId, status: 'in_progress' })],
        toolingRequirements: [],
      });

      proxy.questLoadProxy.fsReadFileProxy.resolves({ content: questJsonWithStep });
      proxy.handleSignalProxy.questUpdateStepProxy.fsReadFileProxy.resolves({
        content: questJsonWithStep,
      });
      proxy.handleSignalProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();
      proxy.questLoadProxy.fsReadFileProxy.resolves({ content: questJsonWithoutStep });

      const activeAgents: ActiveAgent[] = [
        ActiveAgentStub({
          slotIndex,
          stepId,
          sessionId,
          promise: Promise.resolve(signalResult),
        }),
      ];

      const result = await orchestrationLoopLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
        activeAgents,
      });

      expect(result).toStrictEqual({ done: false, activeAgents: [] });
    });

    it('VALID: {signal: partially-complete, session is null} => respawns without resume session', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const stepId = StepIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const slotIndex = SlotIndexStub({ value: 0 });
      const newSlotIndex = SlotIndexStub({ value: 1 });
      const releaseSlotSpy = jest.fn(() => true);
      const getAvailableSlotMock = jest
        .fn()
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(newSlotIndex);
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: getAvailableSlotMock,
        releaseSlot: releaseSlotSpy,
      });

      const signal = StreamSignalStub({
        signal: 'partially-complete',
        stepId,
        progress: 'Made some progress' as never,
      });
      const signalResult = AgentSpawnStreamingResultStub({
        sessionId: null,
        crashed: false as never,
        timedOut: false as never,
        signal,
      });

      const questJson = JSON.stringify({
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
            name: 'Test Step',
            description: 'Test Description',
          }),
        ],
        toolingRequirements: [],
      });

      proxy.questLoadProxy.fsReadFileProxy.resolves({ content: questJson });
      proxy.questLoadProxy.fsReadFileProxy.resolves({ content: questJson });

      proxy.handleSignalProxy.questUpdateStepProxy.fsReadFileProxy.resolves({
        content: questJson,
      });
      proxy.handleSignalProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();

      proxy.spawnAgentProxy.agentSpawnByRoleProxy.setupCodeweaverSuccess({
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const activeAgents: ActiveAgent[] = [
        ActiveAgentStub({
          slotIndex,
          stepId,
          sessionId: null,
          promise: Promise.resolve(signalResult),
        }),
      ];

      const result = await orchestrationLoopLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
        activeAgents,
      });

      expect(result).toStrictEqual({
        done: false,
        activeAgents: [
          {
            slotIndex: newSlotIndex,
            stepId,
            sessionId: null,
            promise: expect.any(Promise),
          },
        ],
      });
    });
  });

  describe('agent completes with signal - needs-role-followup', () => {
    it('VALID: {signal: needs-role-followup, slot available, has reason and context} => spawns role agent', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const stepId = StepIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const slotIndex = SlotIndexStub({ value: 0 });
      const newSlotIndex = SlotIndexStub({ value: 1 });
      const sessionId = SessionIdStub({ value: 'session-123' });
      const releaseSlotSpy = jest.fn(() => true);
      const getAvailableSlotMock = jest
        .fn()
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(newSlotIndex);
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: getAvailableSlotMock,
        releaseSlot: releaseSlotSpy,
      });

      const signal = StreamSignalStub({
        signal: 'needs-role-followup',
        stepId,
        targetRole: 'codeweaver' as never,
        reason: 'Code review needed' as never,
        context: 'PR #123' as never,
      });
      const signalResult = AgentSpawnStreamingResultStub({
        sessionId,
        crashed: false as never,
        timedOut: false as never,
        signal,
      });

      proxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify({
          id: 'test-quest',
          folder: '001-test',
          title: 'Test Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          contexts: [],
          observables: [],
          steps: [DependencyStepStub({ id: stepId, status: 'in_progress' })],
          toolingRequirements: [],
        }),
      });

      proxy.handleSignalProxy.questUpdateStepProxy.fsReadFileProxy.resolves({
        content: JSON.stringify({
          id: 'test-quest',
          folder: '001-test',
          title: 'Test Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          contexts: [],
          observables: [],
          steps: [DependencyStepStub({ id: stepId, status: 'in_progress' })],
          toolingRequirements: [],
        }),
      });
      proxy.handleSignalProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();

      // Second quest load for spawn_role case
      proxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify({
          id: 'test-quest',
          folder: '001-test',
          title: 'Test Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          contexts: [],
          observables: [],
          steps: [DependencyStepStub({ id: stepId, status: 'in_progress' })],
          toolingRequirements: [],
        }),
      });

      proxy.spawnAgentProxy.agentSpawnByRoleProxy.setupCodeweaverSuccess({
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const activeAgents: ActiveAgent[] = [
        ActiveAgentStub({
          slotIndex,
          stepId,
          sessionId,
          promise: Promise.resolve(signalResult),
        }),
      ];

      const result = await orchestrationLoopLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
        activeAgents,
      });

      expect(result).toStrictEqual({
        done: false,
        activeAgents: [
          {
            slotIndex: newSlotIndex,
            stepId,
            sessionId: null,
            promise: expect.any(Promise),
          },
        ],
      });
    });

    it('VALID: {signal: needs-role-followup, no reason or context} => spawns role agent with defaults', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const stepId = StepIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const slotIndex = SlotIndexStub({ value: 0 });
      const newSlotIndex = SlotIndexStub({ value: 1 });
      const sessionId = SessionIdStub({ value: 'session-123' });
      const releaseSlotSpy = jest.fn(() => true);
      const getAvailableSlotMock = jest
        .fn()
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(newSlotIndex);
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: getAvailableSlotMock,
        releaseSlot: releaseSlotSpy,
      });

      const signal = StreamSignalStub({
        signal: 'needs-role-followup',
        stepId,
        targetRole: 'codeweaver' as never,
      });
      const signalResult = AgentSpawnStreamingResultStub({
        sessionId,
        crashed: false as never,
        timedOut: false as never,
        signal,
      });

      proxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify({
          id: 'test-quest',
          folder: '001-test',
          title: 'Test Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          contexts: [],
          observables: [],
          steps: [DependencyStepStub({ id: stepId, status: 'in_progress' })],
          toolingRequirements: [],
        }),
      });

      proxy.handleSignalProxy.questUpdateStepProxy.fsReadFileProxy.resolves({
        content: JSON.stringify({
          id: 'test-quest',
          folder: '001-test',
          title: 'Test Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          contexts: [],
          observables: [],
          steps: [DependencyStepStub({ id: stepId, status: 'in_progress' })],
          toolingRequirements: [],
        }),
      });
      proxy.handleSignalProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();

      // Second quest load for spawn_role case
      proxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify({
          id: 'test-quest',
          folder: '001-test',
          title: 'Test Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          contexts: [],
          observables: [],
          steps: [DependencyStepStub({ id: stepId, status: 'in_progress' })],
          toolingRequirements: [],
        }),
      });

      proxy.spawnAgentProxy.agentSpawnByRoleProxy.setupCodeweaverSuccess({
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const activeAgents: ActiveAgent[] = [
        ActiveAgentStub({
          slotIndex,
          stepId,
          sessionId,
          promise: Promise.resolve(signalResult),
        }),
      ];

      const result = await orchestrationLoopLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
        activeAgents,
      });

      expect(result).toStrictEqual({
        done: false,
        activeAgents: [
          {
            slotIndex: newSlotIndex,
            stepId,
            sessionId: null,
            promise: expect.any(Promise),
          },
        ],
      });
    });

    it('VALID: {signal: needs-role-followup, no slot available} => continues without spawning', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const stepId = StepIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const slotIndex = SlotIndexStub({ value: 0 });
      const sessionId = SessionIdStub({ value: 'session-123' });
      const releaseSlotSpy = jest.fn(() => true);
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: () => undefined,
        releaseSlot: releaseSlotSpy,
      });

      const signal = StreamSignalStub({
        signal: 'needs-role-followup',
        stepId,
        targetRole: 'codeweaver' as never,
      });
      const signalResult = AgentSpawnStreamingResultStub({
        sessionId,
        crashed: false as never,
        timedOut: false as never,
        signal,
      });

      proxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify({
          id: 'test-quest',
          folder: '001-test',
          title: 'Test Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          contexts: [],
          observables: [],
          steps: [DependencyStepStub({ id: stepId, status: 'in_progress' })],
          toolingRequirements: [],
        }),
      });

      proxy.handleSignalProxy.questUpdateStepProxy.fsReadFileProxy.resolves({
        content: JSON.stringify({
          id: 'test-quest',
          folder: '001-test',
          title: 'Test Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          contexts: [],
          observables: [],
          steps: [DependencyStepStub({ id: stepId, status: 'in_progress' })],
          toolingRequirements: [],
        }),
      });
      proxy.handleSignalProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();

      // Second quest load for spawn_role case
      proxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify({
          id: 'test-quest',
          folder: '001-test',
          title: 'Test Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          contexts: [],
          observables: [],
          steps: [DependencyStepStub({ id: stepId, status: 'in_progress' })],
          toolingRequirements: [],
        }),
      });

      const activeAgents: ActiveAgent[] = [
        ActiveAgentStub({
          slotIndex,
          stepId,
          sessionId,
          promise: Promise.resolve(signalResult),
        }),
      ];

      const result = await orchestrationLoopLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
        activeAgents,
      });

      expect(result).toStrictEqual({ done: false, activeAgents: [] });
    });
  });

  describe('edge cases', () => {
    it('EDGE: {no ready steps, has active agents} => waits for active agent to complete', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const stepId1 = StepIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const stepId2 = StepIdStub({ value: 'ffffffff-1111-2222-3333-444444444444' });
      const slotIndex = SlotIndexStub({ value: 0 });
      const sessionId = SessionIdStub({ value: 'session-123' });
      const releaseSlotSpy = jest.fn(() => true);
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: () => SlotIndexStub({ value: 1 }),
        releaseSlot: releaseSlotSpy,
      });

      const spawnResult = AgentSpawnStreamingResultStub({
        sessionId,
        crashed: false as never,
        timedOut: false as never,
        signal: null,
      });

      proxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify({
          id: 'test-quest',
          folder: '001-test',
          title: 'Test Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          contexts: [],
          observables: [],
          steps: [
            DependencyStepStub({ id: stepId1, status: 'in_progress' }),
            DependencyStepStub({ id: stepId2, status: 'pending', dependsOn: [stepId1] }),
          ],
          toolingRequirements: [],
        }),
      });

      proxy.questUpdateStepProxy.fsReadFileProxy.resolves({
        content: JSON.stringify({
          id: 'test-quest',
          folder: '001-test',
          title: 'Test Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          contexts: [],
          observables: [],
          steps: [
            DependencyStepStub({ id: stepId1, status: 'in_progress' }),
            DependencyStepStub({ id: stepId2, status: 'pending', dependsOn: [stepId1] }),
          ],
          toolingRequirements: [],
        }),
      });
      proxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();

      const activeAgents: ActiveAgent[] = [
        ActiveAgentStub({
          slotIndex,
          stepId: stepId1,
          sessionId,
          promise: Promise.resolve(spawnResult),
        }),
      ];

      const result = await orchestrationLoopLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
        activeAgents,
      });

      expect(result).toStrictEqual({ done: false, activeAgents: [] });
      expect(releaseSlotSpy).toHaveBeenCalledWith({ slotIndex });
    });

    it('EDGE: {multiple active agents, one completes} => removes completed agent by slotIndex lookup', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const stepId = StepIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const otherStepId = StepIdStub({ value: 'ffffffff-1111-2222-3333-444444444444' });
      const slotIndex = SlotIndexStub({ value: 0 });
      const otherSlotIndex = SlotIndexStub({ value: 1 });
      const sessionId = SessionIdStub({ value: 'session-123' });
      const otherSessionId = SessionIdStub({ value: 'session-456' });
      const releaseSlotSpy = jest.fn(() => true);
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: () => undefined,
        releaseSlot: releaseSlotSpy,
      });

      const spawnResult = AgentSpawnStreamingResultStub({
        sessionId,
        crashed: false as never,
        timedOut: false as never,
        signal: null,
      });

      proxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify({
          id: 'test-quest',
          folder: '001-test',
          title: 'Test Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          contexts: [],
          observables: [],
          steps: [
            DependencyStepStub({ id: stepId, status: 'in_progress' }),
            DependencyStepStub({ id: otherStepId, status: 'in_progress' }),
          ],
          toolingRequirements: [],
        }),
      });

      proxy.questUpdateStepProxy.fsReadFileProxy.resolves({
        content: JSON.stringify({
          id: 'test-quest',
          folder: '001-test',
          title: 'Test Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          contexts: [],
          observables: [],
          steps: [
            DependencyStepStub({ id: stepId, status: 'in_progress' }),
            DependencyStepStub({ id: otherStepId, status: 'in_progress' }),
          ],
          toolingRequirements: [],
        }),
      });
      proxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();

      // This test exercises the defensive check at line 100.
      // The implementation compares slotIndex values using findIndex after
      // Promise.race completes. When an agent is found (agentIndex !== -1),
      // it gets spliced from activeAgents.
      //
      // Note: Due to the code structure where Promise.race captures the same
      // object reference that's in activeAgents, the defensive check for
      // agentIndex === -1 is practically unreachable under normal operation.
      // This test verifies the normal case where findIndex successfully
      // locates and removes the completed agent by slotIndex.

      const activeAgents: ActiveAgent[] = [];

      const completingAgent = ActiveAgentStub({
        slotIndex,
        stepId,
        sessionId,
        promise: Promise.resolve(spawnResult),
      });

      // Add another agent that will remain after the first completes
      const remainingAgent = ActiveAgentStub({
        slotIndex: otherSlotIndex,
        stepId: otherStepId,
        sessionId: otherSessionId,
        promise: new Promise(() => {}),
      });

      activeAgents.push(completingAgent);
      activeAgents.push(remainingAgent);

      const result = await orchestrationLoopLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
        activeAgents,
      });

      // completingAgent completes via Promise.race, findIndex finds it at
      // index 0, splice removes it, leaving only remainingAgent.
      expect(result).toStrictEqual({
        done: false,
        activeAgents: [
          {
            slotIndex: otherSlotIndex,
            stepId: otherStepId,
            sessionId: otherSessionId,
            promise: expect.any(Promise),
          },
        ],
      });
      expect(releaseSlotSpy).toHaveBeenCalledWith({ slotIndex });
    });
  });

  describe('promise race with multiple active agents', () => {
    it('VALID: {multiple active agents} => completes first agent and continues', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const stepId1 = StepIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const stepId2 = StepIdStub({ value: 'ffffffff-1111-2222-3333-444444444444' });
      const slotIndex1 = SlotIndexStub({ value: 0 });
      const slotIndex2 = SlotIndexStub({ value: 1 });
      const sessionId1 = SessionIdStub({ value: 'session-123' });
      const sessionId2 = SessionIdStub({ value: 'session-456' });
      const releaseSlotSpy = jest.fn(() => true);
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: () => undefined,
        releaseSlot: releaseSlotSpy,
      });

      const spawnResult1 = AgentSpawnStreamingResultStub({
        sessionId: sessionId1,
        crashed: false as never,
        timedOut: false as never,
        signal: null,
      });

      proxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify({
          id: 'test-quest',
          folder: '001-test',
          title: 'Test Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          contexts: [],
          observables: [],
          steps: [
            DependencyStepStub({ id: stepId1, status: 'in_progress' }),
            DependencyStepStub({ id: stepId2, status: 'in_progress' }),
          ],
          toolingRequirements: [],
        }),
      });

      proxy.questUpdateStepProxy.fsReadFileProxy.resolves({
        content: JSON.stringify({
          id: 'test-quest',
          folder: '001-test',
          title: 'Test Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          executionLog: [],
          contexts: [],
          observables: [],
          steps: [
            DependencyStepStub({ id: stepId1, status: 'in_progress' }),
            DependencyStepStub({ id: stepId2, status: 'in_progress' }),
          ],
          toolingRequirements: [],
        }),
      });
      proxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();

      const activeAgents: ActiveAgent[] = [
        ActiveAgentStub({
          slotIndex: slotIndex1,
          stepId: stepId1,
          sessionId: sessionId1,
          promise: Promise.resolve(spawnResult1),
        }),
        ActiveAgentStub({
          slotIndex: slotIndex2,
          stepId: stepId2,
          sessionId: sessionId2,
          promise: new Promise(() => {}),
        }),
      ];

      const result = await orchestrationLoopLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
        activeAgents,
      });

      expect(result).toStrictEqual({
        done: false,
        activeAgents: [
          {
            slotIndex: slotIndex2,
            stepId: stepId2,
            sessionId: sessionId2,
            promise: expect.any(Promise),
          },
        ],
      });
      expect(releaseSlotSpy).toHaveBeenCalledWith({ slotIndex: slotIndex1 });
    });
  });
});
