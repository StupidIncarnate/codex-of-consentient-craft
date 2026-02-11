/**
 * PURPOSE: Extracts deduplicated absolute file paths from ward command output
 *
 * USAGE:
 * wardOutputToFilePathsTransformer({ output: ErrorMessageStub({ value: 'Error in /src/file.ts' }) });
 * // Returns [AbsoluteFilePath('/src/file.ts')]
 */

import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
  type ErrorMessage,
} from '@dungeonmaster/shared/contracts';

const FILE_PATH_REGEX = /\/[\w./-]+\.tsx?/gu;

export const wardOutputToFilePathsTransformer = ({
  output,
}: {
  output: ErrorMessage;
}): AbsoluteFilePath[] => {
  const matches = String(output).match(FILE_PATH_REGEX);
  if (!matches) {
    return [];
  }

  const seen = new Set<AbsoluteFilePath>();
  const result: AbsoluteFilePath[] = [];

  for (const match of matches) {
    try {
      const parsed = absoluteFilePathContract.parse(match);
      if (!seen.has(parsed)) {
        seen.add(parsed);
        result.push(parsed);
      }
    } catch {
      // Skip paths that fail absolute path validation
    }
  }

  return result;
};
