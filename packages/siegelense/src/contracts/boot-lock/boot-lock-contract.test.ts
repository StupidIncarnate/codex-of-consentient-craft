import { bootLockContract } from './boot-lock-contract';
import { BootLockStub } from './boot-lock.stub';

describe('bootLockContract', () => {
  describe('valid locks', () => {
    it('VALID: {heldBy, heldByPid, acquiredAtMs} => parses a held boot lock', () => {
      const lock = BootLockStub({
        heldBy: 'inst_7f3a9c21',
        heldByPid: 'proc-12345',
        acquiredAtMs: 1_700_000_000_000,
      });

      const result = bootLockContract.parse(lock);

      expect(result).toStrictEqual({
        heldBy: 'inst_7f3a9c21',
        heldByPid: 'proc-12345',
        acquiredAtMs: 1_700_000_000_000,
      });
    });
  });

  describe('invalid locks', () => {
    it('INVALID: {missing heldBy} => throws Required', () => {
      expect(() =>
        bootLockContract.parse({
          heldByPid: 'proc-12345',
          acquiredAtMs: 1_700_000_000_000,
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {heldBy: "run_1"} => throws for an InstanceId with the wrong prefix', () => {
      expect(() =>
        bootLockContract.parse({
          heldBy: 'run_1',
          heldByPid: 'proc-12345',
          acquiredAtMs: 1_700_000_000_000,
        }),
      ).toThrow(/invalid_string/u);
    });
  });
});
