/**
 * PURPOSE: Wraps jest.requireActual so proxy files can access real module exports without calling jest APIs directly
 *
 * USAGE:
 * const realPath = jestRequireActualAdapter({ module: 'path' }) as { resolve: typeof resolve };
 * realPath.resolve('/a', 'b'); // Calls real path.resolve, not the mock
 *
 * WHEN-TO-USE: When a parent proxy needs the real implementation of a module mocked by a child proxy
 * WHEN-NOT-TO-USE: When registerMock's dispatcher passthrough is sufficient
 */

import type { resolve } from 'path';

// Use jest.requireActual to get the real path module since 'path' may be auto-mocked
// in test files that transitively mock it through their proxy chain
const realPathModule: { resolve: typeof resolve } = jest.requireActual('path');

export const jestRequireActualAdapter = ({ module: moduleName }: { module: string }): unknown => {
  // For non-relative paths (npm packages), resolve directly
  if (!moduleName.startsWith('.')) {
    return jest.requireActual(moduleName);
  }

  // For relative paths, resolve from the caller's directory using stack trace.
  // Scan frames starting at index 2 (skipping Error + this function) and find the first
  // frame whose file path contains '.proxy.' — this is the proxy file that called requireActual.
  // Frame 2 may be a barrel re-export within packages/testing, so we cannot assume it is the caller.
  const callerStack = new Error().stack ?? '';
  const callerLines = callerStack.split('\n');

  for (let i = 2; i < callerLines.length; i++) {
    const line = callerLines[i] ?? '';

    // Only match frames from .proxy.ts or .proxy.js files
    if (!line.includes('.proxy.')) {
      continue;
    }

    // Extract directory from stack frame
    const parenStart = line.indexOf('(');
    const frameText = parenStart >= 0 ? line.substring(parenStart + 1) : line;
    const colonIdx = frameText.indexOf(':');
    const pathPart = colonIdx >= 0 ? frameText.substring(0, colonIdx) : frameText;
    const lastSlash = pathPart.lastIndexOf('/');

    if (lastSlash >= 0) {
      const callerDir = pathPart.substring(0, lastSlash);
      const absolutePath = realPathModule.resolve(callerDir, moduleName);
      return jest.requireActual(absolutePath);
    }
  }

  // Fallback: try direct resolution (non-proxy callers or if no proxy frame found)
  return jest.requireActual(moduleName);
};
