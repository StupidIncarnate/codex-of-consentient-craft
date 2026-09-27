/**
 * PURPOSE: A real `path.ParsedPath`, produced by actually calling `#gateway/node/path`'s own
 * re-exported `parse()` — for a caller that needs a genuine parsed path rather than a hand-typed
 * one.
 *
 * USAGE:
 * const parsed = ParsedPathStub({ path: '/repo/packages/@gateway/node/src/path/path.ts' });
 * // Returns { root: '/', dir: '/repo/packages/@gateway/node/src/path', base: 'path.ts', ext: '.ts', name: 'path' }
 */
import path from './path';
import type { ParsedPath } from 'path';

export const ParsedPathStub = ({
  path: pathToParse = '/repo/packages/@gateway/node/src/path/path.ts',
}: { path?: string } = {}): ParsedPath => path.parse(pathToParse);
