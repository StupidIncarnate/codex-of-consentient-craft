import {
  DependencyStepStub,
  FilePathStub,
  QuestStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';

import { AgentRoleStub } from '../../../contracts/agent-role/agent-role.stub';
import { SlotCountStub } from '../../../contracts/slot-count/slot-count.stub';
import { SlotOperationsStub } from '../../../contracts/slot-operations/slot-operations.stub';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';
import { runOrchestrationLayerBroker } from './run-orchestration-layer-broker';
import { runOrchestrationLayerBrokerProxy } from './run-orchestration-layer-broker.proxy';

describe('runOrchestrationLayerBroker', () => {
  describe('immediate completion', () => {
    it('VALID: {all steps complete, no active agents} => returns completed true', async () => {
      const proxy = runOrchestrationLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });

      proxy.setupQuestLoad({
        questJson: JSON.stringify(
          QuestStub({
            steps: [DependencyStepStub({ id: stepId, status: 'complete', dependsOn: [] })],
          }),
        ),
      });

      const result = await runOrchestrationLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
        activeAgents: [],
      });

      expect(result).toStrictEqual({ completed: true });
    });
  });

  describe('no work available', () => {
    it('VALID: {no available slots, no active agents} => returns completed true', async () => {
      const proxy = runOrchestrationLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: () => undefined,
      });
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });

      proxy.setupQuestLoad({
        questJson: JSON.stringify(
          QuestStub({
            steps: [DependencyStepStub({ id: stepId, status: 'pending', dependsOn: [] })],
          }),
        ),
      });

      const result = await runOrchestrationLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
        activeAgents: [],
      });

      expect(result).toStrictEqual({ completed: true });
    });
  });

  describe('stuck state', () => {
    it('VALID: {failed step, no agents, no ready steps} => returns completed false with incompleteSteps', async () => {
      const proxy = runOrchestrationLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const failedStep = DependencyStepStub({
        id: stepId,
        status: 'failed',
        dependsOn: [],
      });

      proxy.setupQuestLoad({
        questJson: JSON.stringify(
          QuestStub({
            steps: [failedStep],
          }),
        ),
      });

      const result = await runOrchestrationLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
        activeAgents: [],
      });

      expect(result).toStrictEqual({
        completed: false,
        incompleteSteps: [failedStep],
      });
    });
  });
});
