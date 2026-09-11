/**
 * PURPOSE: Renders ONE check that died of memory into the line the summary prints — the package,
 * what it died on, and which piece of evidence said so. Reach for this from the summary rather than
 * assembling the sentence at the call site, so the three causes cannot drift apart in wording.
 *
 * The banner is checked FIRST because it is the only evidence that PROVES memory: V8 wrote those
 * words itself. Exit 134 and a bare signal are both inference from how the process died, so they
 * are reported in their own words rather than as the heap-limit case.
 *
 * USAGE:
 * outOfMemoryReportTransformer({ projectFolder, rawOutput });
 * // Returns '  ward  exit 134  V8 heap limit — the check printed ...'
 */

import { outOfMemoryReportContract } from '../../contracts/out-of-memory-report/out-of-memory-report-contract';
import type { OutOfMemoryReport } from '../../contracts/out-of-memory-report/out-of-memory-report-contract';
import type { ProjectFolder } from '../../contracts/project-folder/project-folder-contract';
import type { RawOutput } from '../../contracts/raw-output/raw-output-contract';
import { outOfMemoryStatics } from '../../statics/out-of-memory/out-of-memory-statics';

export const outOfMemoryReportTransformer = ({
  projectFolder,
  rawOutput,
}: {
  projectFolder: ProjectFolder;
  rawOutput: RawOutput;
}): OutOfMemoryReport => {
  const signal = String(rawOutput.signal ?? '');
  const died = signal === '' ? `exit ${String(rawOutput.exitCode)}` : signal;

  const printedBanner = `${String(rawOutput.stdout)}${String(rawOutput.stderr)}`.includes(
    outOfMemoryStatics.output.banner,
  );
  const aborted =
    Number(rawOutput.exitCode) === outOfMemoryStatics.exitCodes.abort ||
    signal === outOfMemoryStatics.signals.abort;

  const bannerOrSignal = aborted
    ? outOfMemoryStatics.reason.aborted
    : outOfMemoryStatics.reason.killed;
  const reason = printedBanner ? outOfMemoryStatics.reason.heapLimit : bannerOrSignal;

  return outOfMemoryReportContract.parse(`  ${String(projectFolder.name)}  ${died}  ${reason}`);
};
