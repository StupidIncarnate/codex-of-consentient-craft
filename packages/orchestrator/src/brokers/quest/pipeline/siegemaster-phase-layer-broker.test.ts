import {
  DependencyStepStub,
  ExitCodeStub,
  FilePathStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  ObservableIdStub,
  QuestIdStub,
  QuestStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';

import type { OrchestrationPhaseStub } from '../../../contracts/orchestration-phase/orchestration-phase.stub';
import { siegemasterPhaseLayerBroker } from './siegemaster-phase-layer-broker';
import { siegemasterPhaseLayerBrokerProxy } from './siegemaster-phase-layer-broker.proxy';

type OrchestrationPhase = ReturnType<typeof OrchestrationPhaseStub>;

describe('siegemasterPhaseLayerBroker', () => {
  describe('all steps complete', () => {
    it('VALID: {all steps complete} => returns empty failedObservableIds', async () => {
      const proxy = siegemasterPhaseLayerBrokerProxy();
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

      const result = await siegemasterPhaseLayerBroker({
        questId,
        questFilePath,
        startPath,
        onPhaseChange,
      });

      expect(result).toStrictEqual({ failedObservableIds: [] });
      expect(phases).toStrictEqual(['siegemaster']);
    });
  });

  describe('incomplete steps with observables', () => {
    it('VALID: {steps incomplete with observablesSatisfied} => returns failed observable IDs', async () => {
      const proxy = siegemasterPhaseLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const phases: OrchestrationPhase[] = [];
      const onPhaseChange = ({ phase }: { phase: OrchestrationPhase }): void => {
        phases.push(phase);
      };

      const observableId1 = ObservableIdStub({ value: 'redirects-to-dashboard' });
      const observableId2 = ObservableIdStub({ value: 'shows-error-on-invalid-creds' });
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({
        id: stepId,
        status: 'in_progress',
        dependsOn: [],
        observablesSatisfied: [observableId1, observableId2],
      });
      const observable1 = FlowObservableStub({ id: observableId1 });
      const observable2 = FlowObservableStub({ id: observableId2 });
      const node = FlowNodeStub({ observables: [observable1, observable2] });
      const flow = FlowStub({ nodes: [node] });
      const quest = QuestStub({ steps: [step], flows: [flow] });

      proxy.setupQuestLoad({ questJson: JSON.stringify(quest) });
      // Spawn completes with no signal → step stays incomplete (partially-completed)
      proxy.setupSpawnAndMonitor({ lines: [], exitCode: ExitCodeStub({ value: 0 }) });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await siegemasterPhaseLayerBroker({
        questId,
        questFilePath,
        startPath,
        onPhaseChange,
      });

      expect(result).toStrictEqual({
        failedObservableIds: ['redirects-to-dashboard', 'shows-error-on-invalid-creds'],
      });
      expect(phases).toStrictEqual(['siegemaster']);
    });
  });

  describe('quest load error', () => {
    it('ERROR: {quest load fails} => throws error', async () => {
      const proxy = siegemasterPhaseLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const phases: OrchestrationPhase[] = [];
      const onPhaseChange = ({ phase }: { phase: OrchestrationPhase }): void => {
        phases.push(phase);
      };

      proxy.setupQuestLoadError({ error: new Error('Quest file not found') });

      await expect(
        siegemasterPhaseLayerBroker({
          questId,
          questFilePath,
          startPath: FilePathStub({ value: '/project/src' }),
          onPhaseChange,
        }),
      ).rejects.toThrow(/Failed to read file/u);

      expect(phases).toStrictEqual(['siegemaster']);
    });
  });

  describe('abort signal', () => {
    it('VALID: {abortSignal already aborted} => returns empty failedObservableIds without running', async () => {
      siegemasterPhaseLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const phases: OrchestrationPhase[] = [];
      const onPhaseChange = ({ phase }: { phase: OrchestrationPhase }): void => {
        phases.push(phase);
      };

      const controller = new AbortController();
      controller.abort();

      const result = await siegemasterPhaseLayerBroker({
        questId,
        questFilePath,
        startPath: FilePathStub({ value: '/project/src' }),
        onPhaseChange,
        abortSignal: controller.signal,
      });

      expect(result).toStrictEqual({ failedObservableIds: [] });
      expect(phases).toStrictEqual([]);
    });
  });
});
