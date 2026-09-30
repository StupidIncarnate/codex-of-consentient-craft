/**
 * PURPOSE: Reads a source file's text, returning undefined when the file does not exist
 *
 * USAGE:
 * const content = readSourceFileLayerBroker({
 *   filePath: absoluteFilePathContract.parse('/repo/packages/server/src/broker.ts'),
 * });
 * // Returns ContentText or undefined if file is missing
 *
 * WHEN-TO-USE: State-writes broker reading source files for adapter-caller and browser-storage
 * extraction — absence is silently skipped
 */

import { readFileSync } from '#gateway/node/fs';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';

export const readSourceFileLayerBroker = ({
  filePath,
}: {
  filePath: string;
}): ContentText | undefined => {
  try {
    return contentTextContract.parse(readFileSync(String(filePath)));
  } catch {
    return undefined;
  }
};
