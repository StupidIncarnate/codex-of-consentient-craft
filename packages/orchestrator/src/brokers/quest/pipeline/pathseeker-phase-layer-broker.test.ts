import { FilePathStub, ProcessIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

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

      const startPath = FilePathStub({ value: '/project/src' });

      await pathseekerPhaseLayerBroker({ processId, questId, startPath, onPhaseChange });

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

      const startPath = FilePathStub({ value: '/project/src' });

      await pathseekerPhaseLayerBroker({ processId, questId, startPath, onPhaseChange });

      expect(phases).toStrictEqual(['pathseeker']);
    });
  });

  describe('onAgentEntry callback', () => {
    it('VALID: {agent emits lines with onAgentEntry provided} => fires callback with slotIndex 0 and raw entry', async () => {
      const proxy = pathseekerPhaseLayerBrokerProxy();
      const processId = ProcessIdStub({ value: 'proc-ps-3' });
      const questId = QuestIdStub({ value: 'add-auth' });
      const phases: OrchestrationPhase[] = [];
      const onPhaseChange = ({ phase }: { phase: OrchestrationPhase }): void => {
        phases.push(phase);
      };

      type AgentEntryEvent = Parameters<
        NonNullable<Parameters<typeof pathseekerPhaseLayerBroker>[0]['onAgentEntry']>
      >[0];
      const entries: AgentEntryEvent[] = [];
      const onAgentEntry = (params: AgentEntryEvent): void => {
        entries.push(params);
      };

      proxy.setupSpawnSuccessWithLines({ lines: ['line-one', 'line-two'] });

      const startPath = FilePathStub({ value: '/project/src' });

      await pathseekerPhaseLayerBroker({
        processId,
        questId,
        startPath,
        onPhaseChange,
        onAgentEntry,
      });

      expect(entries).toStrictEqual([
        { slotIndex: 0, entry: { raw: 'line-one' } },
        { slotIndex: 0, entry: { raw: 'line-two' } },
      ]);
    });

    it('VALID: {no onAgentEntry provided} => completes without error', async () => {
      const proxy = pathseekerPhaseLayerBrokerProxy();
      const processId = ProcessIdStub({ value: 'proc-ps-4' });
      const questId = QuestIdStub({ value: 'add-auth' });
      const phases: OrchestrationPhase[] = [];
      const onPhaseChange = ({ phase }: { phase: OrchestrationPhase }): void => {
        phases.push(phase);
      };

      proxy.setupSpawnSuccessWithLines({ lines: ['some-line'] });

      const startPath = FilePathStub({ value: '/project/src' });

      await pathseekerPhaseLayerBroker({ processId, questId, startPath, onPhaseChange });

      expect(phases).toStrictEqual(['pathseeker']);
    });
  });
});
