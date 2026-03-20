/**
 * PURPOSE: Extracts the adapter file basename from a stack trace for registerMock caller identification
 *
 * USAGE:
 * const callerPath = stackToMockCallerPathTransformer({ stack: new Error().stack ?? '', frameOffset: 3 });
 * // Returns MockCallerPath like 'child-process-exec-file-adapter'
 */

import { mockCallerPathContract } from '../../contracts/mock-caller-path/mock-caller-path-contract';
import type { MockCallerPath } from '../../contracts/mock-caller-path/mock-caller-path-contract';

export const stackToMockCallerPathTransformer = ({
  stack,
  frameOffset,
}: {
  stack: string;
  frameOffset: number;
}): MockCallerPath => {
  const lines = stack.split('\n');

  for (let i = frameOffset; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const fileMatch = /([^/\\]+)\.(proxy|test)\.(ts|js)/u.exec(line);

    if (fileMatch) {
      const fullName = fileMatch[1] ?? '';
      const baseName = fullName.replace(/\.proxy$/u, '').replace(/\.test$/u, '');
      return mockCallerPathContract.parse(baseName);
    }
  }

  // Fallback: extract any filename from the target frame
  const fallbackLine = lines[frameOffset] ?? '';
  const fallbackMatch = /([^/\\(]+)\.(ts|js)/u.exec(fallbackLine);

  if (fallbackMatch) {
    return mockCallerPathContract.parse(fallbackMatch[1] ?? '');
  }

  return mockCallerPathContract.parse('');
};
