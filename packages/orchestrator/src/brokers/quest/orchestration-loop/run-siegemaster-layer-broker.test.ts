import {
  DependencyStepStub,
  FilePathStub,
  QuestIdStub,
  QuestStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';

import { SlotCountStub } from '../../../contracts/slot-count/slot-count.stub';
import { SlotOperationsStub } from '../../../contracts/slot-operations/slot-operations.stub';
import { runSiegemasterLayerBroker } from './run-siegemaster-layer-broker';
import { runSiegemasterLayerBrokerProxy } from './run-siegemaster-layer-broker.proxy';

describe('runSiegemasterLayerBroker', () => {
  describe('all steps complete', () => {
    it('VALID: {all steps complete} => returns empty failedObservableIds', async () => {
      const proxy = runSiegemasterLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const startPath = FilePathStub({ value: '/project/src' });

      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, status: 'complete', dependsOn: [] });
      const quest = QuestStub({ steps: [step] });

      proxy.setupQuestLoad({ questJson: JSON.stringify(quest) });

      const result = await runSiegemasterLayerBroker({
        questId,
        questFilePath,
        startPath,
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
      });

      expect(result).toStrictEqual({ failedObservableIds: [] });
    });
  });

  describe('no steps', () => {
    it('VALID: {empty steps} => returns empty failedObservableIds', async () => {
      const proxy = runSiegemasterLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const startPath = FilePathStub({ value: '/project/src' });

      const quest = QuestStub({ steps: [] });

      proxy.setupQuestLoad({ questJson: JSON.stringify(quest) });

      const result = await runSiegemasterLayerBroker({
        questId,
        questFilePath,
        startPath,
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
      });

      expect(result).toStrictEqual({ failedObservableIds: [] });
    });
  });

  describe('quest load error', () => {
    it('ERROR: {quest load fails} => throws error', async () => {
      const proxy = runSiegemasterLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });

      proxy.setupQuestLoadError({ error: new Error('Quest file not found') });

      await expect(
        runSiegemasterLayerBroker({
          questId,
          questFilePath,
          startPath: FilePathStub({ value: '/project/src' }),
          slotCount: SlotCountStub(),
          slotOperations: SlotOperationsStub(),
        }),
      ).rejects.toThrow(/Failed to read file/u);
    });
  });
});
