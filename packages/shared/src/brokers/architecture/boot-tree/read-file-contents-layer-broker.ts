/**
 * PURPOSE: Reads a file's source text, returning undefined when the file does not exist
 *
 * USAGE:
 * const content = readFileContentsLayerBroker({ filePath: '/src/startup/start-app.ts' });
 * // Returns ContentText or undefined if file is missing
 *
 * WHEN-TO-USE: Boot-tree broker reading source files for import extraction — absence is expected
 * when a resolved import path resolves to a file that does not exist on disk
 */

import { readFileSync } from '#gateway/node/fs';

export const readFileContentsLayerBroker = ({
  filePath,
}: {
  filePath: string;
}): string | undefined => {
  try {
    return readFileSync(filePath);
  } catch {
    return undefined;
  }
};
