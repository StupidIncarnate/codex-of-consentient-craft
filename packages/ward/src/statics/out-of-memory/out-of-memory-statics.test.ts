import { outOfMemoryStatics } from './out-of-memory-statics';

describe('outOfMemoryStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(outOfMemoryStatics).toStrictEqual({
      output: { banner: 'JavaScript heap out of memory' },
      exitCodes: { abort: 134 },
      signals: { abort: 'SIGABRT', kill: 'SIGKILL' },
      reason: {
        heapLimit: 'V8 heap limit — the check printed "JavaScript heap out of memory" and aborted',
        aborted: 'the process aborted (SIGABRT), which is how V8 ends a run it cannot allocate for',
        killed:
          'the process was killed from outside (SIGKILL) — on a machine running checks that is the kernel out-of-memory reaper',
      },
    });
  });

  it('VALID: exitCodes.abort => is 128 plus the SIGABRT signal number, the shell convention node exits under', () => {
    expect(outOfMemoryStatics.exitCodes.abort).toBe(128 + 6);
  });
});
