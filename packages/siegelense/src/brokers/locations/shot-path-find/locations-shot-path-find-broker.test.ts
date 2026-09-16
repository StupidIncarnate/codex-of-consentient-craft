import { locationsShotPathFindBroker } from './locations-shot-path-find-broker';
import { locationsShotPathFindBrokerProxy } from './locations-shot-path-find-broker.proxy';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import { StepIndexStub } from '../../../contracts/step-index/step-index.stub';
import { RunIdStub } from '../../../contracts/run-id/run-id.stub';
import { locationsRunPathsFindBroker } from '../run-paths-find/locations-run-paths-find-broker';

describe('locationsShotPathFindBroker', () => {
  describe('shot path resolution', () => {
    it('VALID: {shotsDir, step: 4} => returns shotsDir joined with step4.png', () => {
      locationsShotPathFindBrokerProxy();
      const shotsDir = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21/runs/run_2',
      });
      const step = StepIndexStub({ value: 4 });

      const result = locationsShotPathFindBroker({ shotsDir, step });

      expect(result).toBe(
        AbsoluteFilePathStub({
          value: '/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21/runs/run_2/step4.png',
        }),
      );
    });

    it('EDGE: {shotsDir, step: 1} => returns shotsDir joined with step1.png, the first step of a run', () => {
      locationsShotPathFindBrokerProxy();
      const shotsDir = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21/runs/run_1',
      });
      const step = StepIndexStub({ value: 1 });

      const result = locationsShotPathFindBroker({ shotsDir, step });

      expect(result).toBe(
        AbsoluteFilePathStub({
          value: '/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21/runs/run_1/step1.png',
        }),
      );
    });
  });

  describe('two runs never overwrite the same step number', () => {
    it('VALID: {run_1, run_2} both at step 4 => produce two different shot paths', () => {
      locationsShotPathFindBrokerProxy();
      const evidencePath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21',
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
          value: '/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21/runs/run_1/step4.png',
        }),
        AbsoluteFilePathStub({
          value: '/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21/runs/run_2/step4.png',
        }),
      ]);
    });
  });
});
