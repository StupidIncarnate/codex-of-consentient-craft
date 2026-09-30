import { RunResultStub } from '../../../contracts/run-result/run-result.stub';

import { runReturnWriteBroker } from './run-return-write-broker';
import { runReturnWriteBrokerProxy } from './run-return-write-broker.proxy';

describe('runReturnWriteBroker', () => {
  describe('a run result', () => {
    it('VALID: {result} => writes the JSON return and resolves with nothing', async () => {
      const proxy = runReturnWriteBrokerProxy();
      const storedReturnPath =
        '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_2.json';
      const result = RunResultStub();
      proxy.succeeds({ storedReturnPath });

      await expect(runReturnWriteBroker({ storedReturnPath, result })).resolves.toBe(undefined);
    });

    it('VALID: {result} => the written content is the whole result as one JSON line', async () => {
      const proxy = runReturnWriteBrokerProxy();
      const storedReturnPath =
        '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_2.json';
      const result = RunResultStub();
      proxy.succeeds({ storedReturnPath });

      await runReturnWriteBroker({ storedReturnPath, result });

      expect(proxy.writtenFor({ storedReturnPath })).toBe(`${JSON.stringify(result)}\n`);
    });
  });

  describe('the write rejects', () => {
    it('ERROR: {disk write fails} => the return-write broker rejects with the same error', async () => {
      const proxy = runReturnWriteBrokerProxy();
      const storedReturnPath =
        '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_2.json';
      proxy.throws({ storedReturnPath, code: 'ENOSPC' });

      await expect(
        runReturnWriteBroker({ storedReturnPath, result: RunResultStub() }),
      ).rejects.toThrow(
        /^ENOSPC: write '\/repo\/\.dungeonmaster-assets\/siegelense-assets\/guilds\/g1\/instances\/inst_1\/runs\/run_2\.json'$/u,
      );
    });
  });
});
