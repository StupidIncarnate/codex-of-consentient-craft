import {
  DependencyStepStub,
  ExitCodeStub,
  FilePathStub,
  QuestStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';

import { slotManagerOrchestrateBroker } from './slot-manager-orchestrate-broker';
import { slotManagerOrchestrateBrokerProxy } from './slot-manager-orchestrate-broker.proxy';
import { AgentRoleStub } from '../../../contracts/agent-role/agent-role.stub';
import { SlotCountStub } from '../../../contracts/slot-count/slot-count.stub';
import { SlotIndexStub } from '../../../contracts/slot-index/slot-index.stub';
import { SlotOperationsStub } from '../../../contracts/slot-operations/slot-operations.stub';
import { StreamJsonLineStub } from '../../../contracts/stream-json-line/stream-json-line.stub';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';

describe('slotManagerOrchestrateBroker', () => {
  describe('all steps complete', () => {
    it('VALID: {all steps complete} => returns completed true', async () => {
      const { runOrchestrationProxy } = slotManagerOrchestrateBrokerProxy();
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, status: 'complete', dependsOn: [] });
      const quest = QuestStub({ steps: [step] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();

      runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(quest),
      });

      const result = await slotManagerOrchestrateBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
      });

      expect(result).toStrictEqual({ completed: true });
    });

    it('VALID: {multiple steps all complete} => returns completed true', async () => {
      const { runOrchestrationProxy } = slotManagerOrchestrateBrokerProxy();
      const stepId1 = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const stepId2 = StepIdStub({ value: 'b2c3d4e5-f6a7-5b8c-9d0e-1f2a3b4c5d6e' });
      const step1 = DependencyStepStub({ id: stepId1, status: 'complete', dependsOn: [] });
      const step2 = DependencyStepStub({
        id: stepId2,
        status: 'complete',
        dependsOn: [stepId1],
      });
      const quest = QuestStub({ steps: [step1, step2] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();

      runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(quest),
      });

      const result = await slotManagerOrchestrateBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
      });

      expect(result).toStrictEqual({ completed: true });
    });
  });

  describe('blocked scenarios', () => {
    it('VALID: {no available slots and no active agents} => returns completed true', async () => {
      const { runOrchestrationProxy } = slotManagerOrchestrateBrokerProxy();
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, status: 'pending', dependsOn: [] });
      const quest = QuestStub({ steps: [step] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: () => undefined,
      });

      runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(quest),
      });

      const result = await slotManagerOrchestrateBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
      });

      expect(result).toStrictEqual({ completed: true });
    });

    it('VALID: {pending step with incomplete dependency} => returns completed true when no agents active', async () => {
      const { runOrchestrationProxy } = slotManagerOrchestrateBrokerProxy();
      const stepId1 = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const stepId2 = StepIdStub({ value: 'b2c3d4e5-f6a7-5b8c-9d0e-1f2a3b4c5d6e' });
      const step1 = DependencyStepStub({
        id: stepId1,
        status: 'in_progress',
        dependsOn: [],
      });
      const step2 = DependencyStepStub({
        id: stepId2,
        status: 'pending',
        dependsOn: [stepId1],
      });
      const quest = QuestStub({ steps: [step1, step2] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();

      runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(quest),
      });

      const result = await slotManagerOrchestrateBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
      });

      expect(result).toStrictEqual({ completed: true });
    });

    it('VALID: {agent signals needs-user-input} => returns completed false with userInputNeeded', async () => {
      const { runOrchestrationProxy } = slotManagerOrchestrateBrokerProxy();
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, status: 'pending', dependsOn: [] });
      const quest = QuestStub({ steps: [step] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotIndex = SlotIndexStub({ value: 0 });
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: () => slotIndex,
      });
      const exitCode = ExitCodeStub({ value: 0 });
      const signalLine = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [
              {
                type: 'tool_use',
                name: 'mcp__dungeonmaster__signal-back',
                input: {
                  signal: 'needs-user-input',
                  stepId,
                  question: 'What database should I use?',
                  context: 'Need to choose between PostgreSQL and MySQL',
                },
              },
            ],
          },
        }),
      });

      runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(quest),
      });
      runOrchestrationProxy.loopProxy.questUpdateStepProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(quest),
      });
      runOrchestrationProxy.loopProxy.handleSignalProxy.questUpdateStepProxy.fsReadFileProxy.resolves(
        {
          content: JSON.stringify(quest),
        },
      );
      runOrchestrationProxy.loopProxy.spawnAgentProxy.agentSpawnByRoleProxy.setupCodeweaverSuccessWithSignal(
        {
          exitCode,
          lines: [signalLine],
        },
      );

      const result = await slotManagerOrchestrateBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
      });

      expect(result).toStrictEqual({
        completed: false,
        userInputNeeded: {
          stepId,
          question: 'What database should I use?',
          context: 'Need to choose between PostgreSQL and MySQL',
        },
      });
    });
  });

  describe('signal handling - complete', () => {
    it('VALID: {agent signals complete} => continues orchestration and returns completed true', async () => {
      const { runOrchestrationProxy } = slotManagerOrchestrateBrokerProxy();
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, status: 'pending', dependsOn: [] });
      const quest = QuestStub({ steps: [step] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotIndex = SlotIndexStub({ value: 0 });
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: () => slotIndex,
      });
      const exitCode = ExitCodeStub({ value: 0 });
      const signalLine = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [
              {
                type: 'tool_use',
                name: 'mcp__dungeonmaster__signal-back',
                input: {
                  signal: 'complete',
                  stepId,
                  summary: 'Step completed successfully',
                },
              },
            ],
          },
        }),
      });

      const completedQuest = QuestStub({
        steps: [DependencyStepStub({ id: stepId, status: 'complete', dependsOn: [] })],
      });

      runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(quest),
      });
      runOrchestrationProxy.loopProxy.questUpdateStepProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(quest),
      });
      runOrchestrationProxy.loopProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();
      runOrchestrationProxy.loopProxy.handleSignalProxy.questUpdateStepProxy.fsReadFileProxy.resolves(
        {
          content: JSON.stringify(quest),
        },
      );
      runOrchestrationProxy.loopProxy.handleSignalProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();
      runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(completedQuest),
      });
      runOrchestrationProxy.loopProxy.spawnAgentProxy.agentSpawnByRoleProxy.setupCodeweaverSuccessWithSignal(
        {
          exitCode,
          lines: [signalLine],
        },
      );

      const result = await slotManagerOrchestrateBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
      });

      expect(result).toStrictEqual({ completed: true });
    });
  });

  describe('signal handling - partially-complete', () => {
    it('VALID: {agent signals partially-complete} => respawns agent and continues', async () => {
      const { runOrchestrationProxy } = slotManagerOrchestrateBrokerProxy();
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({
        id: stepId,
        status: 'pending',
        dependsOn: [],
        name: 'Test Step',
        description: 'Test Description',
      });
      const quest = QuestStub({ steps: [step] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotIndex = SlotIndexStub({ value: 0 });
      const newSlotIndex = SlotIndexStub({ value: 1 });
      const getAvailableSlotMock = jest
        .fn()
        .mockReturnValueOnce(slotIndex)
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(newSlotIndex);
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: getAvailableSlotMock,
      });
      const exitCode = ExitCodeStub({ value: 0 });
      const signalLine = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [
              {
                type: 'tool_use',
                name: 'mcp__dungeonmaster__signal-back',
                input: {
                  signal: 'partially-complete',
                  stepId,
                  progress: 'Made some progress',
                  continuationPoint: 'Continue from step 3',
                },
              },
            ],
          },
        }),
      });

      const inProgressQuest = QuestStub({
        steps: [
          DependencyStepStub({
            id: stepId,
            status: 'in_progress',
            dependsOn: [],
            name: 'Test Step',
            description: 'Test Description',
          }),
        ],
      });
      const completedQuest = QuestStub({
        steps: [DependencyStepStub({ id: stepId, status: 'complete', dependsOn: [] })],
      });

      runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(quest),
      });
      runOrchestrationProxy.loopProxy.questUpdateStepProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(quest),
      });
      runOrchestrationProxy.loopProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();
      runOrchestrationProxy.loopProxy.handleSignalProxy.questUpdateStepProxy.fsReadFileProxy.resolves(
        {
          content: JSON.stringify(inProgressQuest),
        },
      );
      runOrchestrationProxy.loopProxy.handleSignalProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();
      runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(inProgressQuest),
      });
      runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(completedQuest),
      });
      runOrchestrationProxy.loopProxy.spawnAgentProxy.agentSpawnByRoleProxy.setupCodeweaverSuccessWithSignal(
        {
          exitCode,
          lines: [signalLine],
        },
      );
      runOrchestrationProxy.loopProxy.spawnAgentProxy.agentSpawnByRoleProxy.setupCodeweaverSuccess({
        exitCode,
      });

      const result = await slotManagerOrchestrateBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
      });

      expect(result).toStrictEqual({ completed: true });
    });
  });

  describe('signal handling - needs-role-followup', () => {
    it('VALID: {agent signals needs-role-followup} => spawns role agent and continues', async () => {
      const { runOrchestrationProxy } = slotManagerOrchestrateBrokerProxy();
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, status: 'pending', dependsOn: [] });
      const quest = QuestStub({ steps: [step] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotIndex = SlotIndexStub({ value: 0 });
      const newSlotIndex = SlotIndexStub({ value: 1 });
      const getAvailableSlotMock = jest
        .fn()
        .mockReturnValueOnce(slotIndex)
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(newSlotIndex);
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: getAvailableSlotMock,
      });
      const exitCode = ExitCodeStub({ value: 0 });
      const signalLine = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [
              {
                type: 'tool_use',
                name: 'mcp__dungeonmaster__signal-back',
                input: {
                  signal: 'needs-role-followup',
                  stepId,
                  targetRole: 'reviewer',
                  reason: 'Code review needed',
                  context: 'PR #123',
                },
              },
            ],
          },
        }),
      });

      const inProgressQuest = QuestStub({
        steps: [DependencyStepStub({ id: stepId, status: 'in_progress', dependsOn: [] })],
      });
      const completedQuest = QuestStub({
        steps: [DependencyStepStub({ id: stepId, status: 'complete', dependsOn: [] })],
      });

      runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(quest),
      });
      runOrchestrationProxy.loopProxy.questUpdateStepProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(quest),
      });
      runOrchestrationProxy.loopProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();
      runOrchestrationProxy.loopProxy.handleSignalProxy.questUpdateStepProxy.fsReadFileProxy.resolves(
        {
          content: JSON.stringify(inProgressQuest),
        },
      );
      runOrchestrationProxy.loopProxy.handleSignalProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();
      runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(completedQuest),
      });
      runOrchestrationProxy.loopProxy.spawnAgentProxy.agentSpawnByRoleProxy.setupCodeweaverSuccessWithSignal(
        {
          exitCode,
          lines: [signalLine],
        },
      );
      runOrchestrationProxy.loopProxy.spawnAgentProxy.agentSpawnByRoleProxy.setupCodeweaverSuccess({
        exitCode,
      });

      const result = await slotManagerOrchestrateBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
      });

      expect(result).toStrictEqual({ completed: true });
    });
  });

  describe('agent crash scenarios', () => {
    it('VALID: {agent crashes with non-zero exit code} => respawns agent and continues', async () => {
      const { runOrchestrationProxy } = slotManagerOrchestrateBrokerProxy();
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({
        id: stepId,
        status: 'pending',
        dependsOn: [],
        name: 'Test Step',
        description: 'Test Description',
      });
      const quest = QuestStub({ steps: [step] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotIndex = SlotIndexStub({ value: 0 });
      const newSlotIndex = SlotIndexStub({ value: 1 });
      const getAvailableSlotMock = jest
        .fn()
        .mockReturnValueOnce(slotIndex)
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(newSlotIndex);
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: getAvailableSlotMock,
      });
      const crashExitCode = ExitCodeStub({ value: 1 });
      const successExitCode = ExitCodeStub({ value: 0 });

      const inProgressQuest = QuestStub({
        steps: [
          DependencyStepStub({
            id: stepId,
            status: 'in_progress',
            dependsOn: [],
            name: 'Test Step',
            description: 'Test Description',
          }),
        ],
      });
      const completedQuest = QuestStub({
        steps: [DependencyStepStub({ id: stepId, status: 'complete', dependsOn: [] })],
      });

      runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(quest),
      });
      runOrchestrationProxy.loopProxy.questUpdateStepProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(quest),
      });
      runOrchestrationProxy.loopProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();
      runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(inProgressQuest),
      });
      runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(completedQuest),
      });
      runOrchestrationProxy.loopProxy.spawnAgentProxy.agentSpawnByRoleProxy.setupCodeweaverCrash({
        exitCode: crashExitCode,
      });
      runOrchestrationProxy.loopProxy.spawnAgentProxy.agentSpawnByRoleProxy.setupCodeweaverSuccess({
        exitCode: successExitCode,
      });

      const result = await slotManagerOrchestrateBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
      });

      expect(result).toStrictEqual({ completed: true });
    });
  });

  describe('agent timeout scenarios', () => {
    it('VALID: {agent times out} => respawns agent and continues', async () => {
      const { runOrchestrationProxy } = slotManagerOrchestrateBrokerProxy();
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({
        id: stepId,
        status: 'pending',
        dependsOn: [],
        name: 'Test Step',
        description: 'Test Description',
      });
      const quest = QuestStub({ steps: [step] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotIndex = SlotIndexStub({ value: 0 });
      const newSlotIndex = SlotIndexStub({ value: 1 });
      const getAvailableSlotMock = jest
        .fn()
        .mockReturnValueOnce(slotIndex)
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(newSlotIndex);
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: getAvailableSlotMock,
      });
      const successExitCode = ExitCodeStub({ value: 0 });

      const inProgressQuest = QuestStub({
        steps: [
          DependencyStepStub({
            id: stepId,
            status: 'in_progress',
            dependsOn: [],
            name: 'Test Step',
            description: 'Test Description',
          }),
        ],
      });
      const completedQuest = QuestStub({
        steps: [DependencyStepStub({ id: stepId, status: 'complete', dependsOn: [] })],
      });

      runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(quest),
      });
      runOrchestrationProxy.loopProxy.questUpdateStepProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(quest),
      });
      runOrchestrationProxy.loopProxy.questUpdateStepProxy.fsWriteFileProxy.succeeds();
      runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(inProgressQuest),
      });
      runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(completedQuest),
      });
      runOrchestrationProxy.loopProxy.spawnAgentProxy.agentSpawnByRoleProxy.setupCodeweaverSuccess({
        exitCode: successExitCode,
      });

      // Note: The detailed timeout behavior is tested in orchestration-loop-layer-broker.test.ts
      // This test verifies the flow completes successfully after the orchestration handles it

      const result = await slotManagerOrchestrateBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
      });

      expect(result).toStrictEqual({ completed: true });
    });
  });
});
