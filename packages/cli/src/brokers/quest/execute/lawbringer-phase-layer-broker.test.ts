import {
  FilePathStub,
  QuestStub,
  DependencyStepStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';

import { lawbringerPhaseLayerBroker } from './lawbringer-phase-layer-broker';
import { lawbringerPhaseLayerBrokerProxy } from './lawbringer-phase-layer-broker.proxy';
import { SlotCountStub } from '../../../contracts/slot-count/slot-count.stub';
import { SlotOperationsStub } from '../../../contracts/slot-operations/slot-operations.stub';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';

describe('lawbringerPhaseLayerBroker', () => {
  describe('successful execution', () => {
    it('VALID: {all steps complete} => returns completed true', async () => {
      const { setupQuestFile } = lawbringerPhaseLayerBrokerProxy();
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, status: 'complete', dependsOn: [] });
      const quest = QuestStub({ steps: [step] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();

      setupQuestFile({ questJson: JSON.stringify(quest) });

      const result = await lawbringerPhaseLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
      });

      expect(result).toStrictEqual({ completed: true });
    });
  });

  describe('multiple file pairs', () => {
    it('VALID: {multiple file pairs all complete} => returns completed true', async () => {
      const { setupQuestFile } = lawbringerPhaseLayerBrokerProxy();
      const stepId1 = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const stepId2 = StepIdStub({ value: 'b2c3d4e5-f6a7-5b8c-9d0e-1f2a3b4c5d6e' });
      const step1 = DependencyStepStub({ id: stepId1, status: 'complete', dependsOn: [] });
      const step2 = DependencyStepStub({ id: stepId2, status: 'complete', dependsOn: [] });
      const quest = QuestStub({ steps: [step1, step2] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();

      setupQuestFile({ questJson: JSON.stringify(quest) });

      const result = await lawbringerPhaseLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
      });

      expect(result).toStrictEqual({ completed: true });
    });
  });
});
