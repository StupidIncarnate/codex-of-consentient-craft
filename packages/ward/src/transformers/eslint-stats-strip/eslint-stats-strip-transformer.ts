/**
 * PURPOSE: Drops the per-file `stats` timing tree (and the other keys in `eslintStripKeysStatics`)
 * from ESLint's JSON stdout before it is saved, so `ward raw lint` still prints every message but the
 * saved run stops carrying ~21KB of timing per linted file. Call it only after `fileTimings` has been
 * read from the same output. Output with no JSON array, unparseable JSON, or nothing to drop comes
 * back byte-for-byte unchanged.
 *
 * USAGE:
 * eslintStatsStripTransformer({ output: errorMessageContract.parse('[{"filePath":"a.ts","messages":[],"stats":{}}]') });
 * // Returns '[{"filePath":"a.ts","messages":[]}]'
 */

import { eslintRawReportContract } from '../../contracts/eslint-raw-report/eslint-raw-report-contract';
import { eslintStripKeysStatics } from '../../statics/eslint-strip-keys/eslint-strip-keys-statics';
import { extractJsonArrayTransformer } from '../extract-json-array/extract-json-array-transformer';

export const eslintStatsStripTransformer = ({ output }: { output: string }): string => {
  const start = output.indexOf('[');
  if (start < 0) {
    return output;
  }

  const slice = extractJsonArrayTransformer({ output });
  const parsed = ((): ReturnType<typeof eslintRawReportContract.parse> | null => {
    try {
      return eslintRawReportContract.parse(JSON.parse(slice));
    } catch {
      return null;
    }
  })();

  if (parsed === null) {
    return output;
  }

  const stripKeys: readonly PropertyKey[] = eslintStripKeysStatics.keys;
  const hasStrippable = parsed.some(
    (entry) =>
      typeof entry === 'object' &&
      entry !== null &&
      !Array.isArray(entry) &&
      stripKeys.some((key) => key in entry),
  );
  if (!hasStrippable) {
    return output;
  }

  const stripped = parsed.map((entry) =>
    typeof entry === 'object' && entry !== null && !Array.isArray(entry)
      ? Object.fromEntries(Object.entries(entry).filter(([key]) => !stripKeys.includes(key)))
      : entry,
  );

  return `${output.slice(0, start)}${JSON.stringify(stripped)}${output.slice(start + slice.length)}`;
};
