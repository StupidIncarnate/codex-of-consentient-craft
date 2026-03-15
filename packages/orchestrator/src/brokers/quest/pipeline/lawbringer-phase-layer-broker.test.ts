import {
  DependencyStepStub,
  FilePathStub,
  QuestStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';

import type { OrchestrationPhaseStub } from '../../../contracts/orchestration-phase/orchestration-phase.stub';
import { SlotCountStub } from '../../../contracts/slot-count/slot-count.stub';
import { SlotOperationsStub } from '../../../contracts/slot-operations/slot-operations.stub';
import { lawbringerPhaseLayerBroker } from './lawbringer-phase-layer-broker';
import { lawbringerPhaseLayerBrokerProxy } from './lawbringer-phase-layer-broker.proxy';

type OrchestrationPhase = ReturnType<typeof OrchestrationPhaseStub>;

describe('lawbringerPhaseLayerBroker', () => {
  describe('successful lawbringer phase', () => {
    it('VALID: {quest with completed steps} => calls onPhaseChange with lawbringer and completes', async () => {
      const proxy = lawbringerPhaseLayerBrokerProxy();
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

      await lawbringerPhaseLayerBroker({
        questFilePath,
        startPath,
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
        onPhaseChange,
      });

      expect(phases).toStrictEqual(['lawbringer']);
    });
  });

  describe('quest load error', () => {
    it('ERROR: {quest load fails} => throws error', async () => {
      const proxy = lawbringerPhaseLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const phases: OrchestrationPhase[] = [];
      const onPhaseChange = ({ phase }: { phase: OrchestrationPhase }): void => {
        phases.push(phase);
      };

      proxy.setupQuestLoadError({ error: new Error('Quest file not found') });

      await expect(
        lawbringerPhaseLayerBroker({
          questFilePath,
          startPath: FilePathStub({ value: '/project/src' }),
          slotCount: SlotCountStub(),
          slotOperations: SlotOperationsStub(),
          onPhaseChange,
        }),
      ).rejects.toThrow(/Failed to read file/u);

      expect(phases).toStrictEqual(['lawbringer']);
    });
  });

  describe('aborted signal', () => {
    it('VALID: {abortSignal already aborted} => returns immediately without calling onPhaseChange', async () => {
      lawbringerPhaseLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const phases: OrchestrationPhase[] = [];
      const onPhaseChange = ({ phase }: { phase: OrchestrationPhase }): void => {
        phases.push(phase);
      };
      const controller = new AbortController();
      controller.abort();

      await lawbringerPhaseLayerBroker({
        questFilePath,
        startPath: FilePathStub({ value: '/project/src' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
        onPhaseChange,
        abortSignal: controller.signal,
      });

      expect(phases).toStrictEqual([]);
    });
  });
});
