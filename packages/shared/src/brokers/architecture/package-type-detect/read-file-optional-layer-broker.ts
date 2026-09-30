/**
 * PURPOSE: Reads a file's content returning undefined when the file does not exist instead of throwing
 *
 * USAGE:
 * const content = readFileOptionalLayerBroker({ filePath: '/project/src/startup/start-app.ts' });
 * // Returns ContentText string or undefined if file is missing
 *
 * WHEN-TO-USE: When reading optional files during package-type detection where absence is expected
 */

import { readFileSync } from '#gateway/node/fs';

export const readFileOptionalLayerBroker = ({
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
