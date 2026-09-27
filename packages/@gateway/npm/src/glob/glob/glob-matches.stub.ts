/**
 * PURPOSE: A real array of absolute paths, built by actually calling this subpath's own `glob()`
 * wrapper against this very folder (`__dirname`, never `process.cwd()` — this is a value builder,
 * not a CLI entry point or path-resolver broker) — never a hand-typed array of fake paths, which
 * would prove nothing about the real npm package's matching behavior.
 *
 * USAGE:
 * const paths = await GlobMatchesStub();
 * // Returns the real, absolute path to this subpath's own glob.ts
 */
import { glob } from './glob';

export const GlobMatchesStub = async ({ pattern = 'glob.ts' }: { pattern?: string } = {}): Promise<
  string[]
> => glob(pattern, { cwd: __dirname, ignore: [] });
