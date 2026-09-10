/**
 * PURPOSE: Extracts per-file timing from parsed ESLint JSON output with --stats flag, split into
 * the two numbers `FileTiming` carries. Reach for this rather than reading `stats.times` at a call
 * site: the split between the shared program build and the file's own rule work is the whole point.
 *
 * USAGE:
 * eslintStatsParseTransformer({ eslintResults: parsedJsonArray });
 * // Returns FileTiming[] with one entry per file
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
    let rulesMs = 0;
    for (const pass of passes) {
      const { total } = pass;
      if (total !== undefined && !Number.isNaN(Number(total))) {
        totalMs += Number(total);
      }

      // `parse` is deliberately absent from this sum — it holds the TypeScript program build the
      // first file pays for the whole run, and adding it back is the mis-attribution itself.
      const ownTotals = [
        ...Object.values(pass.rules ?? {}).map((rule) => rule.total),
        pass.fix?.total,
      ];
      for (const own of ownTotals) {
        if (own !== undefined && !Number.isNaN(Number(own))) {
          rulesMs += Number(own);
        }
      }
    }

    timings.push(
      fileTimingContract.parse({
        filePath: String(filePath),
        durationMs: totalMs,
        rulesMs,
      }),
    );
  }

  return timings;
};
