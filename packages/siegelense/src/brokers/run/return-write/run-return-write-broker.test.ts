import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { RunResultStub } from '../../../contracts/run-result/run-result.stub';

import { runReturnWriteBroker } from './run-return-write-broker';
import { runReturnWriteBrokerProxy } from './run-return-write-broker.proxy';

describe('runReturnWriteBroker', () => {
  describe('a run result', () => {
    it('VALID: {result} => writes the JSON return and reports success', async () => {
      const proxy = runReturnWriteBrokerProxy();
      const storedReturnPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2.json',
      });
      const result = RunResultStub();
      proxy.succeeds({ storedReturnPath });

      const written = await runReturnWriteBroker({ storedReturnPath, result });

      expect(written).toStrictEqual({ success: true });
    });

    it('VALID: {result} => the written content is the whole result as one JSON line', async () => {
      const proxy = runReturnWriteBrokerProxy();
      const storedReturnPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2.json',
      });
      const result = RunResultStub();
      proxy.succeeds({ storedReturnPath });

      await runReturnWriteBroker({ storedReturnPath, result });

      expect(proxy.writtenFor({ storedReturnPath })).toBe(`${JSON.stringify(result)}\n`);
    });
  });

  describe('the adapter rejects', () => {
    it('ERROR: {disk write fails} => the return-write broker rejects with the same error', async () => {
      const proxy = runReturnWriteBrokerProxy();
      const storedReturnPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2.json',
      });
      proxy.throws({ storedReturnPath, error: new Error('ENOSPC') });

      const error = await runReturnWriteBroker({ storedReturnPath, result: RunResultStub() }).then(
        (): never => {
          throw new Error('Expected runReturnWriteBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect(error.message).toBe('ENOSPC');
    });
  });
});
