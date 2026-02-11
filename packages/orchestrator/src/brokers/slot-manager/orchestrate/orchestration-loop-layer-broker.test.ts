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
import { orchestrationLoopLayerBroker } from './orchestration-loop-layer-broker';
import { orchestrationLoopLayerBrokerProxy } from './orchestration-loop-layer-broker.proxy';

describe('orchestrationLoopLayerBroker', () => {
  describe('all steps complete', () => {
    it('VALID: {all steps complete, no active agents} => returns done with completed true', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
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

  describe('no work available', () => {
    it('VALID: {no available slots, pending step with no deps} => returns done with completed true', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
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

  describe('failed and blocked steps', () => {
    it('VALID: {failed step, no active agents, no ready steps} => returns completed false with incompleteSteps', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const failedStep = DependencyStepStub({ id: stepId, status: 'failed', dependsOn: [] });

      proxy.setupQuestLoad({
        questJson: JSON.stringify(
          QuestStub({
            steps: [failedStep],
          }),
        ),
      });

      const result = await orchestrationLoopLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
        activeAgents: [],
      });

      expect(result).toStrictEqual({
        done: true,
        result: { completed: false, incompleteSteps: [failedStep] },
      });
    });

    it('VALID: {blocked step, no active agents, no ready steps} => returns completed false with incompleteSteps', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const blockedStep = DependencyStepStub({ id: stepId, status: 'blocked', dependsOn: [] });

      proxy.setupQuestLoad({
        questJson: JSON.stringify(
          QuestStub({
            steps: [blockedStep],
          }),
        ),
      });

      const result = await orchestrationLoopLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
        activeAgents: [],
      });

      expect(result).toStrictEqual({
        done: true,
        result: { completed: false, incompleteSteps: [blockedStep] },
      });
    });

    it('VALID: {mix of complete and failed steps} => returns only incomplete steps', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const slotCount = SlotCountStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();
      const stepId1 = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const stepId2 = StepIdStub({ value: 'b2c3d4e5-f6a7-5b8c-9d0e-1f2a3b4c5d6e' });
      const completeStep = DependencyStepStub({
        id: stepId1,
        status: 'complete',
        dependsOn: [],
      });
      const failedStep = DependencyStepStub({
        id: stepId2,
        status: 'failed',
        dependsOn: [stepId1],
      });

      proxy.setupQuestLoad({
        questJson: JSON.stringify(
          QuestStub({
            steps: [completeStep, failedStep],
          }),
        ),
      });

      const result = await orchestrationLoopLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        role: AgentRoleStub({ value: 'codeweaver' }),
        activeAgents: [],
      });

      expect(result).toStrictEqual({
        done: true,
        result: { completed: false, incompleteSteps: [failedStep] },
      });
    });
  });
});
