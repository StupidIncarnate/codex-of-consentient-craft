/**
 * PURPOSE: Extracts per-file timing from parsed ESLint JSON output with --stats flag
 *
 * USAGE:
 * eslintStatsParseTransformer({ eslintResults: parsedJsonArray });
 * // Returns FileTiming[] with one entry per file, durationMs = sum of stats.times.passes[].total
 */

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

  for (const entry of eslintResults) {
    if (typeof entry !== 'object' || entry === null) {
      continue;
    }

    const filePath: unknown = Reflect.get(entry, 'filePath');
    if (typeof filePath !== 'string' || filePath.length === 0) {
      continue;
    }

    const stats: unknown = Reflect.get(entry, 'stats');
    if (typeof stats !== 'object' || stats === null) {
      continue;
    }

    const times: unknown = Reflect.get(stats, 'times');
    if (typeof times !== 'object' || times === null) {
      continue;
    }

    const passes: unknown = Reflect.get(times, 'passes');
    if (!Array.isArray(passes)) {
      continue;
    }

    let totalMs = 0;
    for (const pass of passes) {
      if (typeof pass === 'object' && pass !== null) {
        const total: unknown = Reflect.get(pass, 'total');
        if (typeof total === 'number' && !Number.isNaN(total)) {
          totalMs += total;
        }
      }
    }

    timings.push(
      fileTimingContract.parse({
        filePath,
        durationMs: totalMs,
      }),
    );
  }

  return timings;
};
