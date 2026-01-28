import {
  FilePathStub,
  QuestStub,
  DependencyStepStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';

import { siegemasterPhaseLayerBroker } from './siegemaster-phase-layer-broker';
import { siegemasterPhaseLayerBrokerProxy } from './siegemaster-phase-layer-broker.proxy';
import { SlotCountStub } from '../../../contracts/slot-count/slot-count.stub';
import { SlotOperationsStub } from '../../../contracts/slot-operations/slot-operations.stub';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';

describe('siegemasterPhaseLayerBroker', () => {
  describe('successful execution', () => {
    it('VALID: {all steps complete} => returns completed true', async () => {
      const { setupQuestFile } = siegemasterPhaseLayerBrokerProxy();
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, status: 'complete', dependsOn: [] });
      const quest = QuestStub({ steps: [step] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });
      const slotCount = SlotCountStub({ value: 1 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();

      setupQuestFile({ questJson: JSON.stringify(quest) });

      const result = await siegemasterPhaseLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
      });

      expect(result).toStrictEqual({ completed: true });
    });
  });

  describe('user input needed', () => {
    it('VALID: {agent needs user input} => returns completed false with userInputNeeded', async () => {
      const { setupQuestFile } = siegemasterPhaseLayerBrokerProxy();
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, status: 'blocked', dependsOn: [] });
      const quest = QuestStub({ steps: [step] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });
      const slotCount = SlotCountStub({ value: 1 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();

      setupQuestFile({ questJson: JSON.stringify(quest) });

      const result = await siegemasterPhaseLayerBroker({
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
      });

      expect(result).toStrictEqual({ completed: true });
    });
  });
});
