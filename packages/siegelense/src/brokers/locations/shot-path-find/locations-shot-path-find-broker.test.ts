import { locationsShotPathFindBroker } from './locations-shot-path-find-broker';
import { locationsShotPathFindBrokerProxy } from './locations-shot-path-find-broker.proxy';
import { AbsoluteFilePathStub, FileNameStub } from '@dungeonmaster/shared/contracts';
import { StepIndexStub } from '../../../contracts/step-index/step-index.stub';
import { RunIdStub } from '../../../contracts/run-id/run-id.stub';
import { locationsRunPathsFindBroker } from '../run-paths-find/locations-run-paths-find-broker';

describe('locationsShotPathFindBroker', () => {
  describe('shot path resolution', () => {
    it('VALID: {shotsDir, step: 4} => returns shotsDir joined with step4.png', () => {
      locationsShotPathFindBrokerProxy();
      const shotsDir = AbsoluteFilePathStub({
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21/runs/run_2',
      });
      const step = StepIndexStub({ value: 4 });

      const result = locationsShotPathFindBroker({ shotsDir, step });

      expect(result).toBe(
        AbsoluteFilePathStub({
          value:
            '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21/runs/run_2/step4.png',
        }),
      );
    });

    it('EDGE: {shotsDir, step: 1} => returns shotsDir joined with step1.png, the first step of a run', () => {
      locationsShotPathFindBrokerProxy();
      const shotsDir = AbsoluteFilePathStub({
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21/runs/run_1',
      });
      const step = StepIndexStub({ value: 1 });

      const result = locationsShotPathFindBroker({ shotsDir, step });

      expect(result).toBe(
        AbsoluteFilePathStub({
          value:
            '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21/runs/run_1/step1.png',
        }),
      );
    });
  });

  describe('a caller-supplied name', () => {
    it('VALID: {shotsDir, step: 2, name: after-create.png} => returns shotsDir joined with the caller name, not the step-indexed default', () => {
      locationsShotPathFindBrokerProxy();
      const shotsDir = AbsoluteFilePathStub({
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21/runs/run_2',
      });
      const step = StepIndexStub({ value: 2 });
      const name = FileNameStub({ value: 'after-create.png' });

      const result = locationsShotPathFindBroker({ shotsDir, step, name });

      expect(result).toBe(
        AbsoluteFilePathStub({
          value:
            '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21/runs/run_2/after-create.png',
        }),
      );
    });

    it('VALID: {same name, two different run shotsDirs} => each stays under its own run directory', () => {
      locationsShotPathFindBrokerProxy();
      const evidencePath = AbsoluteFilePathStub({
        value: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21',
      });
      const step = StepIndexStub({ value: 1 });
      const name = FileNameStub({ value: 'shot.png' });

      const firstRunPaths = locationsRunPathsFindBroker({
        evidencePath,
        runId: RunIdStub({ value: 'run_1' }),
      });
      const secondRunPaths = locationsRunPathsFindBroker({
        evidencePath,
        runId: RunIdStub({ value: 'run_2' }),
      });

      const firstShot = locationsShotPathFindBroker({
        shotsDir: firstRunPaths.shotsDir,
        step,
        name,
      });
      const secondShot = locationsShotPathFindBroker({
        shotsDir: secondRunPaths.shotsDir,
        step,
        name,
      });

      expect([firstShot, secondShot]).toStrictEqual([
        AbsoluteFilePathStub({
          value:
            '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21/runs/run_1/shot.png',
        }),
        AbsoluteFilePathStub({
          value:
            '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21/runs/run_2/shot.png',
        }),
      ]);
    });
  });

  describe('two runs never overwrite the same step number', () => {
    it('VALID: {run_1, run_2} both at step 4 => produce two different shot paths', () => {
      locationsShotPathFindBrokerProxy();
      const evidencePath = AbsoluteFilePathStub({
        value: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21',
      });
      const step = StepIndexStub({ value: 4 });

      const firstRunPaths = locationsRunPathsFindBroker({
        evidencePath,
        runId: RunIdStub({ value: 'run_1' }),
      });
      const secondRunPaths = locationsRunPathsFindBroker({
        evidencePath,
        runId: RunIdStub({ value: 'run_2' }),
      });

      const firstShot = locationsShotPathFindBroker({ shotsDir: firstRunPaths.shotsDir, step });
      const secondShot = locationsShotPathFindBroker({ shotsDir: secondRunPaths.shotsDir, step });

      expect([firstShot, secondShot]).toStrictEqual([
        AbsoluteFilePathStub({
          value:
            '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21/runs/run_1/step4.png',
        }),
        AbsoluteFilePathStub({
          value:
            '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21/runs/run_2/step4.png',
        }),
      ]);
    });
  });
});
