/**
 * PURPOSE: Reads a source file's text, returning undefined when the file does not exist
 *
 * USAGE:
 * const content = readFileLayerBroker({
 *   filePath: absoluteFilePathContract.parse('/repo/packages/server/src/flows/quest/quest-flow.ts'),
 * });
 * // Returns ContentText or undefined if file is missing
 *
 * WHEN-TO-USE: Edge-graph broker reading flow and broker source files — absence is silently skipped
 */

import { readFileSync } from '#gateway/node/fs';

export const readFileLayerBroker = ({ filePath }: { filePath: string }): string | undefined => {
  try {
    return readFileSync(filePath);
  } catch {
    return undefined;
  }
};
