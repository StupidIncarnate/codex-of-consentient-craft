import {
  DependencyStepStub,
  FilePathStub,
  QuestStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';

import { slotManagerOrchestrateBroker } from './slot-manager-orchestrate-broker';
import { slotManagerOrchestrateBrokerProxy } from './slot-manager-orchestrate-broker.proxy';
import { AgentRoleStub } from '../../../contracts/agent-role/agent-role.stub';
import { SlotCountStub } from '../../../contracts/slot-count/slot-count.stub';
import { SlotOperationsStub } from '../../../contracts/slot-operations/slot-operations.stub';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';

describe('slotManagerOrchestrateBroker', () => {
  describe('all steps complete', () => {
    it('VALID: {all steps complete} => returns completed true', async () => {
      const proxy = slotManagerOrchestrateBrokerProxy();
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, status: 'complete', dependsOn: [] });
      const quest = QuestStub({ steps: [step] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();

      proxy.setupQuestLoad({
        questJson: JSON.stringify(quest),
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
      const proxy = slotManagerOrchestrateBrokerProxy();
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

      proxy.setupQuestLoad({
        questJson: JSON.stringify(quest),
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
      const proxy = slotManagerOrchestrateBrokerProxy();
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, status: 'pending', dependsOn: [] });
      const quest = QuestStub({ steps: [step] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: () => undefined,
      });

      proxy.setupQuestLoad({
        questJson: JSON.stringify(quest),
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
      const proxy = slotManagerOrchestrateBrokerProxy();
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

      proxy.setupQuestLoad({
        questJson: JSON.stringify(quest),
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

  // NOTE: Tests for agent spawning, signal handling, crash recovery, and timeout scenarios
  // are currently disabled because agentSpawnByRoleBroker is a stub.
  // These tests will be re-enabled when the full agent spawning infrastructure
  // is migrated from CLI to orchestrator.
});
