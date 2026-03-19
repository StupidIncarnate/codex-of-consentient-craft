/**
 * PURPOSE: Scans a stack trace to find the registered mock handle whose callerPath appears in the stack
 *
 * USAGE:
 * const match = stackToMockHandleMatchTransformer({ stack: new Error().stack ?? '', handles });
 * // Returns the matching MockHandleEntry or undefined
 */

import type { MockHandleEntry } from '../../contracts/mock-handle-entry/mock-handle-entry-contract';

export const stackToMockHandleMatchTransformer = ({
  stack,
  handles,
}: {
  stack: string;
  handles: MockHandleEntry[];
}): MockHandleEntry | undefined => {
  const lines = stack.split('\n');

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i] ?? '';

    for (const handle of handles) {
      if (handle.callerPath && line.includes(handle.callerPath)) {
        return handle;
      }
    }
  }

  return undefined;
};
