/**
 * PURPOSE: Reads a source file's text content, returning undefined when the file does not
 * exist or cannot be read.
 *
 * USAGE:
 * const source = readSourceLayerBroker({
 *   filePath: absoluteFilePathContract.parse('/repo/packages/web/src/widgets/app-widget.ts'),
 * });
 * // Returns ContentText or undefined if the file is missing
 *
 * WHEN-TO-USE: architecture-import-edges-broker reading source files to scan for imports
 */

import { readFileSync } from '#gateway/node/fs';

export const readSourceLayerBroker = ({ filePath }: { filePath: string }): string | undefined => {
  try {
    return readFileSync(filePath);
  } catch {
    return undefined;
  }
};
