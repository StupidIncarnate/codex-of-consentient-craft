import {
  DependencyStepStub,
  FilePathStub,
  QuestStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';

import { SlotCountStub } from '../../../contracts/slot-count/slot-count.stub';
import { SlotOperationsStub } from '../../../contracts/slot-operations/slot-operations.stub';
import { runLawbringerLayerBroker } from './run-lawbringer-layer-broker';
import { runLawbringerLayerBrokerProxy } from './run-lawbringer-layer-broker.proxy';

describe('runLawbringerLayerBroker', () => {
  describe('all steps complete', () => {
    it('VALID: {all steps complete} => resolves successfully', async () => {
      const proxy = runLawbringerLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const startPath = FilePathStub({ value: '/project/src' });

      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, status: 'complete', dependsOn: [] });
      const quest = QuestStub({ steps: [step] });

      proxy.setupQuestLoad({ questJson: JSON.stringify(quest) });

      await expect(
        runLawbringerLayerBroker({
          questFilePath,
          startPath,
          slotCount: SlotCountStub(),
          slotOperations: SlotOperationsStub(),
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('quest load error', () => {
    it('ERROR: {quest load fails} => throws error', async () => {
      const proxy = runLawbringerLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });

      proxy.setupQuestLoadError({ error: new Error('Quest file not found') });

      await expect(
        runLawbringerLayerBroker({
          questFilePath,
          startPath: FilePathStub({ value: '/project/src' }),
          slotCount: SlotCountStub(),
          slotOperations: SlotOperationsStub(),
        }),
      ).rejects.toThrow(/Failed to read file/u);
    });
  });
});
