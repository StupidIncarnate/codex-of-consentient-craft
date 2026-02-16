import {
  DependencyStepStub,
  ExitCodeStub,
  FilePathStub,
  ProcessIdStub,
  QuestIdStub,
  QuestStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';

import type { OrchestrationPhaseStub } from '../../../contracts/orchestration-phase/orchestration-phase.stub';
import { questPipelineBroker } from './quest-pipeline-broker';
import { questPipelineBrokerProxy } from './quest-pipeline-broker.proxy';

type OrchestrationPhase = ReturnType<typeof OrchestrationPhaseStub>;

describe('questPipelineBroker', () => {
  describe('successful full pipeline', () => {
    it('VALID: {all layers succeed} => onPhaseChange called with complete', async () => {
      const proxy = questPipelineBrokerProxy();
      const processId = ProcessIdStub({ value: 'proc-test-1' });
      const questId = QuestIdStub({ value: 'add-auth' });
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const startPath = FilePathStub({ value: '/project/src' });
      const phases: OrchestrationPhase[] = [];
      const onPhaseChange = ({ phase }: { phase: OrchestrationPhase }): void => {
        phases.push(phase);
      };

      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, status: 'complete', dependsOn: [] });
      const quest = QuestStub({ steps: [step] });
      const emptyQuest = QuestStub({ observables: [], contexts: [], steps: [] });

      proxy.setupCodeweaverQuestLoad({ questJson: JSON.stringify(quest) });
      proxy.setupWardSuccessFirstTry({ exitCode: ExitCodeStub({ value: 0 }) });
      proxy.setupSiegemasterQuestFile({ questJson: JSON.stringify(emptyQuest) });
      proxy.setupSiegemasterSpawnsSucceed({ exitCode: ExitCodeStub({ value: 0 }) });
      proxy.setupLawbringerQuestFile({ questJson: JSON.stringify(emptyQuest) });
      proxy.setupLawbringerSpawnsSucceed({ exitCode: ExitCodeStub({ value: 0 }) });

      await questPipelineBroker({
        processId,
        questId,
        questFilePath,
        startPath,
        onPhaseChange,
      });

      expect(phases).toStrictEqual(['codeweaver', 'ward', 'siegemaster', 'lawbringer', 'complete']);
    });
  });

  describe('codeweaver layer throws', () => {
    it('ERROR: {codeweaver fails} => onPhaseChange called with failed and error re-thrown', async () => {
      const proxy = questPipelineBrokerProxy();
      const processId = ProcessIdStub({ value: 'proc-test-2' });
      const questId = QuestIdStub({ value: 'add-auth' });
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const startPath = FilePathStub({ value: '/project/src' });
      const phases: OrchestrationPhase[] = [];
      const onPhaseChange = ({ phase }: { phase: OrchestrationPhase }): void => {
        phases.push(phase);
      };

      proxy.setupCodeweaverQuestLoadError({ error: new Error('Quest file not found') });

      await expect(
        questPipelineBroker({
          processId,
          questId,
          questFilePath,
          startPath,
          onPhaseChange,
        }),
      ).rejects.toThrow(/Failed to read file/u);

      expect(phases).toStrictEqual(['codeweaver', 'failed']);
    });
  });

  describe('later layer throws', () => {
    it('ERROR: {codeweaver succeeds but siegemaster quest load fails} => onPhaseChange has failed', async () => {
      const proxy = questPipelineBrokerProxy();
      const processId = ProcessIdStub({ value: 'proc-test-3' });
      const questId = QuestIdStub({ value: 'add-auth' });
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const startPath = FilePathStub({ value: '/project/src' });
      const phases: OrchestrationPhase[] = [];
      const onPhaseChange = ({ phase }: { phase: OrchestrationPhase }): void => {
        phases.push(phase);
      };

      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, status: 'complete', dependsOn: [] });
      const quest = QuestStub({ steps: [step] });

      proxy.setupCodeweaverQuestLoad({ questJson: JSON.stringify(quest) });
      proxy.setupWardSuccessFirstTry({ exitCode: ExitCodeStub({ value: 0 }) });

      await expect(
        questPipelineBroker({
          processId,
          questId,
          questFilePath,
          startPath,
          onPhaseChange,
        }),
      ).rejects.toThrow(/Failed to parse quest file/u);

      expect(phases).toStrictEqual(['codeweaver', 'ward', 'siegemaster', 'failed']);
    });
  });

  describe('ward layer throws', () => {
    it('ERROR: {codeweaver succeeds but ward fails max retries} => onPhaseChange has failed', async () => {
      const proxy = questPipelineBrokerProxy();
      const processId = ProcessIdStub({ value: 'proc-test-4' });
      const questId = QuestIdStub({ value: 'add-auth' });
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const startPath = FilePathStub({ value: '/project/src' });
      const phases: OrchestrationPhase[] = [];
      const onPhaseChange = ({ phase }: { phase: OrchestrationPhase }): void => {
        phases.push(phase);
      };

      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, status: 'complete', dependsOn: [] });
      const quest = QuestStub({ steps: [step] });

      proxy.setupCodeweaverQuestLoad({ questJson: JSON.stringify(quest) });
      proxy.setupWardFailMaxRetries({
        failExitCode: ExitCodeStub({ value: 1 }),
        failWardResultJson: JSON.stringify({
          checks: [
            {
              checkType: 'lint',
              status: 'fail',
              projectResults: [
                {
                  projectFolder: { name: 'orchestrator', path: '/project/packages/orchestrator' },
                  status: 'fail',
                  errors: [
                    {
                      filePath: '/project/src/brokers/auth/auth-broker.ts',
                      line: 1,
                      column: 1,
                      message: 'err',
                      severity: 'error',
                    },
                  ],
                  testFailures: [],
                  rawOutput: { stdout: '', stderr: '', exitCode: 1 },
                },
              ],
            },
          ],
        }),
        spiritmenderExitCode: ExitCodeStub({ value: 0 }),
      });
      proxy.setupLawbringerSpawnsSucceed({ exitCode: ExitCodeStub({ value: 0 }) });

      await expect(
        questPipelineBroker({
          processId,
          questId,
          questFilePath,
          startPath,
          onPhaseChange,
        }),
      ).rejects.toThrow(/Ward phase failed after 3 retries/u);

      expect(phases).toStrictEqual(['codeweaver', 'ward', 'failed']);
    });
  });

  describe('lawbringer layer throws', () => {
    it('ERROR: {codeweaver+ward+siegemaster succeed but lawbringer quest load fails} => onPhaseChange has failed', async () => {
      const proxy = questPipelineBrokerProxy();
      const processId = ProcessIdStub({ value: 'proc-test-5' });
      const questId = QuestIdStub({ value: 'add-auth' });
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const startPath = FilePathStub({ value: '/project/src' });
      const phases: OrchestrationPhase[] = [];
      const onPhaseChange = ({ phase }: { phase: OrchestrationPhase }): void => {
        phases.push(phase);
      };

      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, status: 'complete', dependsOn: [] });
      const quest = QuestStub({ steps: [step] });
      const emptyQuest = QuestStub({ observables: [], contexts: [], steps: [] });

      proxy.setupCodeweaverQuestLoad({ questJson: JSON.stringify(quest) });
      proxy.setupWardSuccessFirstTry({ exitCode: ExitCodeStub({ value: 0 }) });
      proxy.setupSiegemasterQuestFile({ questJson: JSON.stringify(emptyQuest) });
      proxy.setupSiegemasterSpawnsSucceed({ exitCode: ExitCodeStub({ value: 0 }) });

      await expect(
        questPipelineBroker({
          processId,
          questId,
          questFilePath,
          startPath,
          onPhaseChange,
        }),
      ).rejects.toThrow(/Failed to parse quest file/u);

      expect(phases).toStrictEqual(['codeweaver', 'ward', 'siegemaster', 'lawbringer', 'failed']);
    });
  });

  describe('phase call order', () => {
    it('VALID: {all succeed} => codeweaver before ward before siegemaster before lawbringer before complete', async () => {
      const proxy = questPipelineBrokerProxy();
      const processId = ProcessIdStub({ value: 'proc-test-6' });
      const questId = QuestIdStub({ value: 'add-auth' });
      const questFilePath = FilePathStub({ value: '/quests/quest.json' });
      const startPath = FilePathStub({ value: '/project/src' });
      const phases: OrchestrationPhase[] = [];
      const onPhaseChange = ({ phase }: { phase: OrchestrationPhase }): void => {
        phases.push(phase);
      };

      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, status: 'complete', dependsOn: [] });
      const quest = QuestStub({ steps: [step] });
      const emptyQuest = QuestStub({ observables: [], contexts: [], steps: [] });

      proxy.setupCodeweaverQuestLoad({ questJson: JSON.stringify(quest) });
      proxy.setupWardSuccessFirstTry({ exitCode: ExitCodeStub({ value: 0 }) });
      proxy.setupSiegemasterQuestFile({ questJson: JSON.stringify(emptyQuest) });
      proxy.setupSiegemasterSpawnsSucceed({ exitCode: ExitCodeStub({ value: 0 }) });
      proxy.setupLawbringerQuestFile({ questJson: JSON.stringify(emptyQuest) });
      proxy.setupLawbringerSpawnsSucceed({ exitCode: ExitCodeStub({ value: 0 }) });

      await questPipelineBroker({
        processId,
        questId,
        questFilePath,
        startPath,
        onPhaseChange,
      });

      expect(phases).toStrictEqual(['codeweaver', 'ward', 'siegemaster', 'lawbringer', 'complete']);
    });
  });
});
