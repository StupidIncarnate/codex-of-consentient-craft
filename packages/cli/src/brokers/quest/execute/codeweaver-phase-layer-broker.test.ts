import {
  FilePathStub,
  QuestStub,
  DependencyStepStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';

import { codeweaverPhaseLayerBroker } from './codeweaver-phase-layer-broker';
import { codeweaverPhaseLayerBrokerProxy } from './codeweaver-phase-layer-broker.proxy';
import { SlotCountStub } from '../../../contracts/slot-count/slot-count.stub';
import { SlotOperationsStub } from '../../../contracts/slot-operations/slot-operations.stub';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';

describe('codeweaverPhaseLayerBroker', () => {
  describe('successful execution', () => {
    it('VALID: {all steps complete} => returns completed true', async () => {
      const { slotManagerProxy } = codeweaverPhaseLayerBrokerProxy();
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, status: 'complete', dependsOn: [] });
      const quest = QuestStub({ steps: [step] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();

      slotManagerProxy.runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(quest),
      });

      const result = await codeweaverPhaseLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
      });

      expect(result).toStrictEqual({ completed: true });
    });
  });

  describe('multiple steps', () => {
    it('VALID: {multiple steps all complete} => returns completed true', async () => {
      const { slotManagerProxy } = codeweaverPhaseLayerBrokerProxy();
      const stepId1 = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const stepId2 = StepIdStub({ value: 'b2c3d4e5-f6a7-5b8c-9d0e-1f2a3b4c5d6e' });
      const step1 = DependencyStepStub({ id: stepId1, status: 'complete', dependsOn: [] });
      const step2 = DependencyStepStub({ id: stepId2, status: 'complete', dependsOn: [stepId1] });
      const quest = QuestStub({ steps: [step1, step2] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();

      slotManagerProxy.runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(quest),
      });

      const result = await codeweaverPhaseLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
      });

      expect(result).toStrictEqual({ completed: true });
    });
  });
});
