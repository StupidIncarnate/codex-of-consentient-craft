import { isOutOfMemoryFailureGuard } from './is-out-of-memory-failure-guard';
import { RawOutputStub } from '../../contracts/raw-output/raw-output.stub';
import { ProcessSignalStub } from '@dungeonmaster/shared/contracts';

describe('isOutOfMemoryFailureGuard', () => {
  describe('out of memory', () => {
    it("VALID: {stderr carries V8's heap banner} => returns true", () => {
      const rawOutput = RawOutputStub({
        exitCode: 134,
        stderr:
          '\n<--- Last few GCs --->\n\nFATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory\n',
      });

      expect(isOutOfMemoryFailureGuard({ rawOutput })).toBe(true);
    });

    it('VALID: {banner on stdout instead of stderr} => returns true', () => {
      const rawOutput = RawOutputStub({
        exitCode: 1,
        stdout: 'FATAL ERROR: JavaScript heap out of memory',
      });

      expect(isOutOfMemoryFailureGuard({ rawOutput })).toBe(true);
    });

    it('VALID: {exitCode: 134, no banner captured} => returns true', () => {
      const rawOutput = RawOutputStub({ exitCode: 134 });

      expect(isOutOfMemoryFailureGuard({ rawOutput })).toBe(true);
    });

    it('VALID: {signal: SIGKILL, exitCode flattened to 1, no output} => returns true', () => {
      // The shape the kernel out-of-memory reaper leaves: the process is destroyed outright, so it
      // reports nothing and its exit code is the spawn wrapper's stand-in 1. Without the signal
      // this is byte-identical to a tool that failed on the user's own code.
      const rawOutput = RawOutputStub({
        exitCode: 1,
        signal: ProcessSignalStub({ value: 'SIGKILL' }),
      });

      expect(isOutOfMemoryFailureGuard({ rawOutput })).toBe(true);
    });

    it('VALID: {signal: SIGABRT} => returns true', () => {
      const rawOutput = RawOutputStub({
        exitCode: 1,
        signal: ProcessSignalStub({ value: 'SIGABRT' }),
      });

      expect(isOutOfMemoryFailureGuard({ rawOutput })).toBe(true);
    });
  });

  describe('ordinary failures', () => {
    it('INVALID: {exitCode: 1, real lint errors on stdout} => returns false', () => {
      const rawOutput = RawOutputStub({
        exitCode: 1,
        stdout: '[{"filePath":"/src/a.ts","errorCount":2,"messages":[]}]',
      });

      expect(isOutOfMemoryFailureGuard({ rawOutput })).toBe(false);
    });

    it('INVALID: {exitCode: 2} => returns false', () => {
      expect(isOutOfMemoryFailureGuard({ rawOutput: RawOutputStub({ exitCode: 2 }) })).toBe(false);
    });

    it('VALID: {exitCode: 0} => returns false', () => {
      expect(isOutOfMemoryFailureGuard({ rawOutput: RawOutputStub({ exitCode: 0 }) })).toBe(false);
    });

    it('INVALID: {signal: SIGTERM from a timeout kill} => returns false', () => {
      // The spawn adapter's own timeout sends SIGTERM. A check ward gave up on is a timeout, not an
      // out-of-memory death, and reporting it as memory would send a reader after the wrong thing.
      const rawOutput = RawOutputStub({
        exitCode: 1,
        signal: ProcessSignalStub({ value: 'SIGTERM' }),
      });

      expect(isOutOfMemoryFailureGuard({ rawOutput })).toBe(false);
    });

    it("INVALID: {output merely mentioning memory} => returns false, because it is not V8's banner", () => {
      const rawOutput = RawOutputStub({
        exitCode: 1,
        stderr: 'warning: this suite uses a lot of memory',
      });

      expect(isOutOfMemoryFailureGuard({ rawOutput })).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {rawOutput: undefined} => returns false', () => {
      expect(isOutOfMemoryFailureGuard({})).toBe(false);
    });

    it('EMPTY: {signal absent, as a saved result written before the field existed} => returns false', () => {
      expect(isOutOfMemoryFailureGuard({ rawOutput: RawOutputStub({ exitCode: 1 }) })).toBe(false);
    });
  });
});
