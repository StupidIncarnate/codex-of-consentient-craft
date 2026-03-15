import {
  DependencyStepStub,
  FilePathStub,
  QuestIdStub,
  QuestStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';

import type { OrchestrationPhaseStub } from '../../../contracts/orchestration-phase/orchestration-phase.stub';
import { SlotCountStub } from '../../../contracts/slot-count/slot-count.stub';
import { SlotOperationsStub } from '../../../contracts/slot-operations/slot-operations.stub';
import { codeweaverPhaseLayerBroker } from './codeweaver-phase-layer-broker';
import { codeweaverPhaseLayerBrokerProxy } from './codeweaver-phase-layer-broker.proxy';

type OrchestrationPhase = ReturnType<typeof OrchestrationPhaseStub>;

describe('codeweaverPhaseLayerBroker', () => {
  describe('successful codeweaver phase', () => {
    it('VALID: {all steps complete} => calls onPhaseChange with codeweaver and completes', async () => {
      const proxy = codeweaverPhaseLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const phases: OrchestrationPhase[] = [];
      const onPhaseChange = ({ phase }: { phase: OrchestrationPhase }): void => {
        phases.push(phase);
      };

      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, status: 'complete', dependsOn: [] });
      const quest = QuestStub({ steps: [step] });

      proxy.setupQuestLoad({ questJson: JSON.stringify(quest) });

      const startPath = FilePathStub({ value: '/project/src' });

      await codeweaverPhaseLayerBroker({
        questId,
        questFilePath,
        startPath,
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
        onPhaseChange,
      });

      expect(phases).toStrictEqual(['codeweaver']);
    });
  });

  describe('slot manager error', () => {
    it('ERROR: {quest load fails} => throws error', async () => {
      const proxy = codeweaverPhaseLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const phases: OrchestrationPhase[] = [];
      const onPhaseChange = ({ phase }: { phase: OrchestrationPhase }): void => {
        phases.push(phase);
      };

      proxy.setupQuestLoadError({ error: new Error('Quest file not found') });

      await expect(
        codeweaverPhaseLayerBroker({
          questId,
          questFilePath,
          startPath: FilePathStub({ value: '/project/src' }),
          slotCount: SlotCountStub(),
          slotOperations: SlotOperationsStub(),
          onPhaseChange,
        }),
      ).rejects.toThrow(/Failed to read file/u);

      expect(phases).toStrictEqual(['codeweaver']);
    });
  });
});
