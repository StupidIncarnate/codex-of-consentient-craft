/**
 * PURPOSE: Reads a file's content returning undefined when the file does not exist instead of throwing
 *
 * USAGE:
 * const content = readFileOptionalLayerBroker({ filePath: '/project/package.json' });
 * // Returns ContentText string or undefined if file is missing
 *
 * WHEN-TO-USE: When reading optional files during e2e eligibility detection where absence is expected
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
