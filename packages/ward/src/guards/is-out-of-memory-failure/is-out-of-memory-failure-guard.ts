/**
 * PURPOSE: Answers whether a check FAILED BECAUSE IT RAN OUT OF MEMORY, rather than because the
 * tool it ran found something wrong. Reach for this wherever a failing check is about to be
 * reported, because the two are indistinguishable from the exit code alone and only one of them is
 * the user's code.
 *
 * An eslint the kernel's out-of-memory reaper killed reaches ward as exit code 1 with unparseable
 * output, so `eslintJsonParseTransformer` throws, `errors` lands empty and `filesCount` stays 0 —
 * printed as `lint @dungeonmaster/<pkg> FAIL 0 files, 0 errors`. A failing check with nothing
 * listed and no cause, which reads as a mystery rather than as a machine that ran out of memory.
 *
 * The three pieces of evidence are ORed because each arrives on its own in a real case: V8 prints
 * its banner and aborts (banner + exit 134), a spawn wrapper that flattens the signal keeps only
 * the exit code, and a SIGKILL from outside leaves no output at all.
 *
 * USAGE:
 * isOutOfMemoryFailureGuard({ rawOutput: RawOutputStub({ exitCode: 134 }) });
 * // Returns: true
 */

import type { RawOutput } from '../../contracts/raw-output/raw-output-contract';
import { outOfMemoryStatics } from '../../statics/out-of-memory/out-of-memory-statics';

export const isOutOfMemoryFailureGuard = ({ rawOutput }: { rawOutput?: RawOutput }): boolean => {
  if (!rawOutput) {
    return false;
  }

  const printedBanner = `${String(rawOutput.stdout)}${String(rawOutput.stderr)}`.includes(
    outOfMemoryStatics.output.banner,
  );
  const aborted = Number(rawOutput.exitCode) === outOfMemoryStatics.exitCodes.abort;
  const signal = String(rawOutput.signal ?? '');
  const killed =
    signal === outOfMemoryStatics.signals.kill || signal === outOfMemoryStatics.signals.abort;

  return printedBanner || aborted || killed;
};
