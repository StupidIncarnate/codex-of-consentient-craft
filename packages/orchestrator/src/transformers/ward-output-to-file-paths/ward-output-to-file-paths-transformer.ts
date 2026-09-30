/**
 * PURPOSE: Extracts deduplicated absolute file paths from structured WardResult JSON
 *
 * USAGE:
 * wardOutputToFilePathsTransformer({ wardResultJson: '{"checks":[...]}' });
 * // Returns ['/src/file.ts']
 */

import { wardDetailJsonContract } from '../../contracts/ward-detail-json/ward-detail-json-contract';

const ABSOLUTE_PATH = /^(?:\/|[A-Za-z]:\\)/u;

export const wardOutputToFilePathsTransformer = ({
  wardResultJson,
}: {
  wardResultJson: string;
}): string[] => {
  const parseResult = wardDetailJsonContract.safeParse(JSON.parse(wardResultJson));

  if (!parseResult.success) {
    return [];
  }

  const detail = parseResult.data;
  const checks = detail.checks ?? [];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const check of checks) {
    for (const projectResult of check.projectResults ?? []) {
      const candidates = [
        ...(projectResult.errors ?? []).map((error) => error.filePath),
        ...(projectResult.testFailures ?? []).map((failure) => failure.suitePath),
      ];

      for (const candidate of candidates) {
        if (candidate !== undefined && ABSOLUTE_PATH.test(candidate) && !seen.has(candidate)) {
          seen.add(candidate);
          result.push(candidate);
        }
      }
    }
  }

  return result;
};
