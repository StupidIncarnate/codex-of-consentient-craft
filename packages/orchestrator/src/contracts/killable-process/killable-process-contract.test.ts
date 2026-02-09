import { killableProcessContract } from './killable-process-contract';
import { KillableProcessStub } from './killable-process.stub';

type KillableProcess = ReturnType<typeof KillableProcessStub>;

describe('killableProcessContract', () => {
  describe('valid processes', () => {
    it('VALID: {kill function} => parses successfully', () => {
      const process: KillableProcess = KillableProcessStub({
        kill: () => true,
      });

      expect(process.kill()).toBe(true);
    });

    it('VALID: {default stub} => creates process with working kill', () => {
      const process: KillableProcess = KillableProcessStub();

      expect(process.kill()).toBe(true);
    });

    it('VALID: {kill returns false} => parses successfully', () => {
      const process: KillableProcess = KillableProcessStub({
        kill: () => false,
      });

      expect(process.kill()).toBe(false);
    });

    it('VALID: {raw object} => contract parses function', () => {
      const result = killableProcessContract.parse({
        kill: () => true,
        waitForExit: async () => Promise.resolve(),
      });

      expect(typeof result.kill).toBe('function');
    });

    it('VALID: {waitForExit function} => parses successfully', () => {
      const process: KillableProcess = KillableProcessStub();

      expect(typeof process.waitForExit).toBe('function');
    });

    it('VALID: {waitForExit returns promise} => resolves to void', async () => {
      const process: KillableProcess = KillableProcessStub();

      await expect(process.waitForExit()).resolves.toBeUndefined();
    });
  });
});
