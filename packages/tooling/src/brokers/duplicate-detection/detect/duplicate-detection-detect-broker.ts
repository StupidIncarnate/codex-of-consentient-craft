/**
 * PURPOSE: Detects duplicate string and regex literals across multiple TypeScript files.
 *
 * USAGE:
 * const reports = await duplicateDetectionDetectBroker({ pattern: '**/*.ts', cwd: '/path', threshold: 3, minLength: 3 });
 * // Returns: readonly DuplicateLiteralReport[] (array of duplicate literal reports sorted by occurrence count)
 */
import type { GlobPattern } from '../../../contracts/glob-pattern/glob-pattern-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { DuplicateLiteralReport } from '../../../contracts/duplicate-literal-report/duplicate-literal-report-contract';
import type { LiteralOccurrence } from '../../../contracts/literal-occurrence/literal-occurrence-contract';
import type { LiteralValue } from '../../../contracts/literal-value/literal-value-contract';
import type { OccurrenceThreshold } from '../../../contracts/occurrence-threshold/occurrence-threshold-contract';
import { globFindAdapter } from '../../../adapters/glob/find/glob-find-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { typescriptParseAdapter } from '../../../adapters/typescript/parse/typescript-parse-adapter';
import { duplicateLiteralReportContract } from '../../../contracts/duplicate-literal-report/duplicate-literal-report-contract';
import { literalTypeContract } from '../../../contracts/literal-type/literal-type-contract';
import { duplicateDetectionStatics } from '../../../statics/duplicate-detection/duplicate-detection-statics';
import { isRegexLiteralGuard } from '../../../guards/is-regex-literal/is-regex-literal-guard';

export const duplicateDetectionDetectBroker = async ({
  pattern,
  cwd,
  threshold,
  minLength,
}: {
  pattern: GlobPattern;
  cwd?: AbsoluteFilePath;
  threshold?: OccurrenceThreshold;
  minLength?: number;
}): Promise<readonly DuplicateLiteralReport[]> => {
  const actualThreshold = threshold ?? duplicateDetectionStatics.defaults.threshold;
  const actualMinLength = minLength ?? duplicateDetectionStatics.defaults.minLength;

  // Find all TypeScript files
  const filePaths = await globFindAdapter(cwd ? { pattern, cwd } : { pattern });

  // Aggregate literals across all files
  const globalLiteralsMap = new Map<LiteralValue, LiteralOccurrence[]>();

  // Process all files in parallel
  const fileResults = await Promise.all(
    filePaths.map(async (filePath) => {
      const sourceCode = await fsReadFileAdapter({ filePath });
      const fileLiterals = typescriptParseAdapter({
        sourceCode,
        filePath,
        minLength: actualMinLength,
      });
      return fileLiterals;
    }),
  );

  // Merge all file literals into global map
  for (const fileLiterals of fileResults) {
    for (const [literalValue, occurrences] of fileLiterals) {
      const existing = globalLiteralsMap.get(literalValue);
      if (existing) {
        existing.push(...occurrences);
      } else {
        globalLiteralsMap.set(literalValue, [...occurrences]);
      }
    }
  }

  // Filter for duplicates (threshold or more occurrences)
  const duplicates: DuplicateLiteralReport[] = [];

  for (const [literalValue, occurrences] of globalLiteralsMap) {
    if (occurrences.length >= actualThreshold) {
      // Determine type based on content
      const isRegex = isRegexLiteralGuard({ value: literalValue });
      const type = literalTypeContract.parse(isRegex ? 'regex' : 'string');

      duplicates.push(
        duplicateLiteralReportContract.parse({
          value: literalValue,
          type,
          occurrences,
          count: occurrences.length,
        }),
      );
    }
  }

  // Sort by count descending (most duplicated first)
  return duplicates.sort((a, b) => b.count - a.count);
};
