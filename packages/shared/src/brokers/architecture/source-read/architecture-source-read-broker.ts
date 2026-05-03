/**
 * PURPOSE: Reads a TypeScript source file's text content, returning undefined when
 * the file does not exist or cannot be read
 *
 * USAGE:
 * const source = architectureSourceReadBroker({
 *   filePath: absoluteFilePathContract.parse('/repo/packages/web/src/bindings/use-quest/use-quest-binding.ts'),
 * });
 * // Returns ContentText or undefined if the file is missing
 *
 * WHEN-TO-USE: Architecture brokers reading source files where file absence is a normal
 * condition (not an error) — boot-tree, edge-graph, project-map renderers, etc.
 */

import { fsReadFileSyncAdapter } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const architectureSourceReadBroker = ({
  filePath,
}: {
  filePath: AbsoluteFilePath;
}): ContentText | undefined => {
  try {
    return fsReadFileSyncAdapter({ filePath });
  } catch {
    return undefined;
  }
};
