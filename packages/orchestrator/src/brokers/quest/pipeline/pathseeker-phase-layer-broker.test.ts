import { ProcessIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import type { OrchestrationPhaseStub } from '../../../contracts/orchestration-phase/orchestration-phase.stub';
import { pathseekerPhaseLayerBroker } from './pathseeker-phase-layer-broker';
import { pathseekerPhaseLayerBrokerProxy } from './pathseeker-phase-layer-broker.proxy';

type OrchestrationPhase = ReturnType<typeof OrchestrationPhaseStub>;

describe('pathseekerPhaseLayerBroker', () => {
  describe('successful pathseeker phase', () => {
    it('VALID: {spawn exits with 0} => calls onPhaseChange with pathseeker and completes', async () => {
      const proxy = pathseekerPhaseLayerBrokerProxy();
      const processId = ProcessIdStub({ value: 'proc-ps-1' });
      const questId = QuestIdStub({ value: 'add-auth' });
      const phases: OrchestrationPhase[] = [];
      const onPhaseChange = ({ phase }: { phase: OrchestrationPhase }): void => {
        phases.push(phase);
      };

      proxy.setupSpawnSuccess();

      await pathseekerPhaseLayerBroker({ processId, questId, onPhaseChange });

      expect(phases).toStrictEqual(['pathseeker']);
    });
  });

  describe('non-zero exit code', () => {
    it('VALID: {spawn exits with 1} => still completes phase', async () => {
      const proxy = pathseekerPhaseLayerBrokerProxy();
      const processId = ProcessIdStub({ value: 'proc-ps-2' });
      const questId = QuestIdStub({ value: 'add-auth' });
      const phases: OrchestrationPhase[] = [];
      const onPhaseChange = ({ phase }: { phase: OrchestrationPhase }): void => {
        phases.push(phase);
      };

      proxy.setupSpawnFailure();

      await pathseekerPhaseLayerBroker({ processId, questId, onPhaseChange });

      expect(phases).toStrictEqual(['pathseeker']);
    });
  });
});
