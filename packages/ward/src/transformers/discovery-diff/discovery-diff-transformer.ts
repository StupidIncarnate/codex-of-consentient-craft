/**
 * PURPOSE: Computes set differences between discovered and processed file lists
 *
 * USAGE:
 * discoveryDiffTransformer({ discoveredFiles: ['src/a.ts'], processedFiles: ['src/b.ts'], cwd: absoluteFilePathContract.parse('/project') });
 * // Returns: { onlyDiscovered: ['src/a.ts'], onlyProcessed: ['src/b.ts'] }
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import {
  gitRelativePathContract,
  type GitRelativePath,
} from '../../contracts/git-relative-path/git-relative-path-contract';
import { normalizeToRelativeTransformer } from '../normalize-to-relative/normalize-to-relative-transformer';

export const discoveryDiffTransformer = ({
  discoveredFiles,
  processedFiles,
  cwd,
}: {
  discoveredFiles: GitRelativePath[];
  processedFiles: GitRelativePath[];
  cwd: AbsoluteFilePath;
}): { onlyDiscovered: GitRelativePath[]; onlyProcessed: GitRelativePath[] } => {
  const normalizedDiscovered = new Set(
    discoveredFiles.map((file) => String(normalizeToRelativeTransformer({ filePath: file, cwd }))),
  );
  const normalizedProcessed = new Set(
    processedFiles.map((file) => String(normalizeToRelativeTransformer({ filePath: file, cwd }))),
  );

  const onlyDiscovered = [...normalizedDiscovered]
    .filter((file) => !normalizedProcessed.has(file))
    .map((file) => gitRelativePathContract.parse(file));

  const onlyProcessed = [...normalizedProcessed]
    .filter((file) => !normalizedDiscovered.has(file))
    .map((file) => gitRelativePathContract.parse(file));

  return { onlyDiscovered, onlyProcessed };
};
