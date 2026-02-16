import {
  AbsoluteFilePathStub,
  DependencyStepStub,
  ExitCodeStub,
  FilePathStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import type { OrchestrationPhaseStub } from '../../../contracts/orchestration-phase/orchestration-phase.stub';
import { wardPhaseLayerBroker } from './ward-phase-layer-broker';
import { wardPhaseLayerBrokerProxy } from './ward-phase-layer-broker.proxy';

type OrchestrationPhase = ReturnType<typeof OrchestrationPhaseStub>;

const FAIL_WARD_RESULT_JSON = JSON.stringify({
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
              filePath: '/src/brokers/test/test-broker.ts',
              line: 5,
              column: 1,
              message: 'Lint failed',
              severity: 'error',
            },
          ],
          testFailures: [],
          rawOutput: { stdout: '', stderr: '', exitCode: 1 },
        },
      ],
    },
  ],
});

const NO_PATHS_WARD_RESULT_JSON = JSON.stringify({
  checks: [
    {
      checkType: 'lint',
      status: 'fail',
      projectResults: [
        {
          projectFolder: { name: 'orchestrator', path: '/project/packages/orchestrator' },
          status: 'fail',
          errors: [],
          testFailures: [],
          rawOutput: { stdout: 'Some error without file paths', stderr: '', exitCode: 1 },
        },
      ],
    },
  ],
});

describe('wardPhaseLayerBroker', () => {
  describe('ward succeeds first try', () => {
    it('VALID: {ward exits 0} => returns successfully without spiritmender', async () => {
      const proxy = wardPhaseLayerBrokerProxy();
      proxy.setupWardSuccessFirstTry({ exitCode: ExitCodeStub({ value: 0 }) });

      const phases: OrchestrationPhase[] = [];
      const onPhaseChange = ({ phase }: { phase: OrchestrationPhase }): void => {
        phases.push(phase);
      };

      await wardPhaseLayerBroker({
        questFilePath: FilePathStub({ value: '/quests/quest.json' }),
        startPath: AbsoluteFilePathStub({ value: '/project' }),
        onPhaseChange,
      });

      expect(phases).toStrictEqual(['ward']);
    });
  });

  describe('ward fails then succeeds on retry', () => {
    it('VALID: {ward fails with file paths, spiritmender runs, ward succeeds} => returns successfully', async () => {
      const proxy = wardPhaseLayerBrokerProxy();
      proxy.setupWardFailThenSucceed({
        failExitCode: ExitCodeStub({ value: 1 }),
        failWardResultJson: FAIL_WARD_RESULT_JSON,
        successExitCode: ExitCodeStub({ value: 0 }),
        spiritmenderExitCode: ExitCodeStub({ value: 0 }),
      });

      const phases: OrchestrationPhase[] = [];
      const onPhaseChange = ({ phase }: { phase: OrchestrationPhase }): void => {
        phases.push(phase);
      };

      await wardPhaseLayerBroker({
        questFilePath: FilePathStub({ value: '/quests/quest.json' }),
        startPath: AbsoluteFilePathStub({ value: '/project' }),
        onPhaseChange,
      });

      expect(phases).toStrictEqual(['ward']);
    });
  });

  describe('ward fails with no file paths in output, falls back to quest steps', () => {
    it('VALID: {ward output has no paths, quest steps have files} => uses quest step files for spiritmender', async () => {
      const proxy = wardPhaseLayerBrokerProxy();
      const quest = QuestStub({
        steps: [
          DependencyStepStub({
            filesToCreate: ['/src/brokers/auth/login/auth-login-broker.ts'],
            filesToModify: ['/src/contracts/user/user-contract.ts'],
          }),
        ],
      });

      proxy.setupWardFailNoPathsFallbackToQuest({
        failExitCode: ExitCodeStub({ value: 1 }),
        failWardResultJson: NO_PATHS_WARD_RESULT_JSON,
        questJson: JSON.stringify(quest),
        successExitCode: ExitCodeStub({ value: 0 }),
        spiritmenderExitCode: ExitCodeStub({ value: 0 }),
      });

      const phases: OrchestrationPhase[] = [];
      const onPhaseChange = ({ phase }: { phase: OrchestrationPhase }): void => {
        phases.push(phase);
      };

      await wardPhaseLayerBroker({
        questFilePath: FilePathStub({ value: '/quests/quest.json' }),
        startPath: AbsoluteFilePathStub({ value: '/project' }),
        onPhaseChange,
      });

      expect(phases).toStrictEqual(['ward']);
    });
  });

  describe('ward fails max retries', () => {
    it('ERROR: {ward fails 3 times} => throws error after max retries', async () => {
      const proxy = wardPhaseLayerBrokerProxy();
      proxy.setupWardFailMaxRetries({
        failExitCode: ExitCodeStub({ value: 1 }),
        failWardResultJson: FAIL_WARD_RESULT_JSON,
        spiritmenderExitCode: ExitCodeStub({ value: 0 }),
      });

      const phases: OrchestrationPhase[] = [];
      const onPhaseChange = ({ phase }: { phase: OrchestrationPhase }): void => {
        phases.push(phase);
      };

      await expect(
        wardPhaseLayerBroker({
          questFilePath: FilePathStub({ value: '/quests/quest.json' }),
          startPath: AbsoluteFilePathStub({ value: '/project' }),
          onPhaseChange,
        }),
      ).rejects.toThrow(/Ward phase failed after 3 retries/u);
    });
  });

  describe('ward fails with empty output and no quest step files', () => {
    it('ERROR: {no file paths from output or quest} => throws error about missing file paths', async () => {
      const proxy = wardPhaseLayerBrokerProxy();
      const quest = QuestStub({ steps: [] });

      proxy.setupWardFailNoPathsNoQuest({
        failExitCode: ExitCodeStub({ value: 1 }),
        questJson: JSON.stringify(quest),
      });

      const phases: OrchestrationPhase[] = [];
      const onPhaseChange = ({ phase }: { phase: OrchestrationPhase }): void => {
        phases.push(phase);
      };

      await expect(
        wardPhaseLayerBroker({
          questFilePath: FilePathStub({ value: '/quests/quest.json' }),
          startPath: AbsoluteFilePathStub({ value: '/project' }),
          onPhaseChange,
        }),
      ).rejects.toThrow(/no file paths could be extracted for spiritmender/u);
    });
  });

  describe('onPhaseChange', () => {
    it('VALID: {fail then succeed} => calls onPhaseChange with ward phase only once', async () => {
      const proxy = wardPhaseLayerBrokerProxy();
      proxy.setupWardFailThenSucceed({
        failExitCode: ExitCodeStub({ value: 1 }),
        failWardResultJson: FAIL_WARD_RESULT_JSON,
        successExitCode: ExitCodeStub({ value: 0 }),
        spiritmenderExitCode: ExitCodeStub({ value: 0 }),
      });

      const phases: OrchestrationPhase[] = [];
      const onPhaseChange = ({ phase }: { phase: OrchestrationPhase }): void => {
        phases.push(phase);
      };

      await wardPhaseLayerBroker({
        questFilePath: FilePathStub({ value: '/quests/quest.json' }),
        startPath: AbsoluteFilePathStub({ value: '/project' }),
        onPhaseChange,
      });

      expect(phases).toStrictEqual(['ward']);
    });
  });
});
