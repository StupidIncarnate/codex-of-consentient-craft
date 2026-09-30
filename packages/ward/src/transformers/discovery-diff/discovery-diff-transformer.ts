/**
 * PURPOSE: Computes set differences between discovered and processed file lists
 *
 * USAGE:
 * discoveryDiffTransformer({ discoveredFiles: ['src/a.ts'], processedFiles: ['src/b.ts'], cwd: '/project' });
 * // Returns: { onlyDiscovered: ['src/a.ts'], onlyProcessed: ['src/b.ts'] }
 */

import { discoveryDiffContract } from '../../contracts/discovery-diff/discovery-diff-contract';
import type { DiscoveryDiff } from '../../contracts/discovery-diff/discovery-diff-contract';
import { normalizeToRelativeTransformer } from '../normalize-to-relative/normalize-to-relative-transformer';

export const discoveryDiffTransformer = ({
  discoveredFiles,
  processedFiles,
  cwd,
}: {
  discoveredFiles: string[];
  processedFiles: string[];
  cwd: string;
}): DiscoveryDiff => {
  const normalizedDiscovered = new Set(
    discoveredFiles.map((file) => normalizeToRelativeTransformer({ filePath: file, cwd })),
  );
  const normalizedProcessed = new Set(
    processedFiles.map((file) => normalizeToRelativeTransformer({ filePath: file, cwd })),
  );

  const onlyDiscovered = [...normalizedDiscovered]
    .filter((file) => !normalizedProcessed.has(file))
    .map((file) => file);

  const onlyProcessed = [...normalizedProcessed]
    .filter((file) => !normalizedDiscovered.has(file))
    .map((file) => file);

  return discoveryDiffContract.parse({ onlyDiscovered, onlyProcessed });
};
