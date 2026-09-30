/**
 * PURPOSE: Reads a source file's text, returning undefined when the file does not exist
 *
 * USAGE:
 * const content = readFileLayerBroker({
 *   filePath: '/repo/packages/orchestrator/src/state/orchestration-events-state.ts',
 * });
 * // Returns ContentText or undefined if file is missing
 *
 * WHEN-TO-USE: WS-edges broker reading source files — absence is silently skipped
 */

import { readFileSync } from '#gateway/node/fs';

export const readFileLayerBroker = ({ filePath }: { filePath: string }): string | undefined => {
  try {
    return readFileSync(filePath);
  } catch {
    return undefined;
  }
};
