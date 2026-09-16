import { locationsRunPathsFindBroker } from './locations-run-paths-find-broker';
import { locationsRunPathsFindBrokerProxy } from './locations-run-paths-find-broker.proxy';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import { RunIdStub } from '../../../contracts/run-id/run-id.stub';

describe('locationsRunPathsFindBroker', () => {
  describe('run path resolution', () => {
    it('VALID: {evidencePath, runId: run_2} => returns the transcript, stored return and shots dir paths', () => {
      locationsRunPathsFindBrokerProxy();
      const evidencePath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21',
      });
      const runId = RunIdStub({ value: 'run_2' });

      const result = locationsRunPathsFindBroker({ evidencePath, runId });

      expect(result).toStrictEqual({
        transcript: AbsoluteFilePathStub({
          value: '/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21/runs/run_2.jsonl',
        }),
        storedReturn: AbsoluteFilePathStub({
          value: '/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21/runs/run_2.json',
        }),
        shotsDir: AbsoluteFilePathStub({
          value: '/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21/runs/run_2',
        }),
      });
    });
  });

  describe('two different runs never share a shots directory', () => {
    it('VALID: {runId: run_1} vs {runId: run_2} => shotsDir differs between the two runs', () => {
      locationsRunPathsFindBrokerProxy();
      const evidencePath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21',
      });

      const firstRun = locationsRunPathsFindBroker({
        evidencePath,
        runId: RunIdStub({ value: 'run_1' }),
      });
      const secondRun = locationsRunPathsFindBroker({
        evidencePath,
        runId: RunIdStub({ value: 'run_2' }),
      });

      expect([firstRun.shotsDir, secondRun.shotsDir]).toStrictEqual([
        AbsoluteFilePathStub({
          value: '/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21/runs/run_1',
        }),
        AbsoluteFilePathStub({
          value: '/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21/runs/run_2',
        }),
      ]);
    });
  });
});
