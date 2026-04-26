/**
 * PURPOSE: Extracts per-file timing from parsed ESLint JSON output with --stats flag
 *
 * USAGE:
 * eslintStatsParseTransformer({ eslintResults: parsedJsonArray });
 * // Returns FileTiming[] with one entry per file, durationMs = sum of stats.times.passes[].total
 */

import { eslintJsonReportEntryContract } from '../../contracts/eslint-json-report-entry/eslint-json-report-entry-contract';
import {
  fileTimingContract,
  type FileTiming,
} from '../../contracts/file-timing/file-timing-contract';

export const eslintStatsParseTransformer = ({
  eslintResults,
}: {
  eslintResults: unknown[];
}): FileTiming[] => {
  const timings: FileTiming[] = [];

  for (const rawEntry of eslintResults) {
    const entry = ((): ReturnType<typeof eslintJsonReportEntryContract.parse> | null => {
      try {
        return eslintJsonReportEntryContract.parse(rawEntry);
      } catch {
        return null;
      }
    })();

    if (entry === null) {
      continue;
    }

    const { filePath } = entry;
    if (filePath === undefined || String(filePath).length === 0) {
      continue;
    }

    const passes = entry.stats?.times?.passes;
    if (passes === undefined) {
      continue;
    }

    let totalMs = 0;
    for (const pass of passes) {
      const { total } = pass;
      if (total !== undefined && !Number.isNaN(Number(total))) {
        totalMs += Number(total);
      }
    }

    timings.push(
      fileTimingContract.parse({
        filePath: String(filePath),
        durationMs: totalMs,
      }),
    );
  }

  return timings;
};
