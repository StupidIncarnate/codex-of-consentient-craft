/**
 * PURPOSE: OUR guarded `glob`, reconciling the three copies this repo carried today (mcp's two,
 * server's, tooling's). `ignore` is a required argument, never a baked-in default list — what a
 * scan skips is a decision built from the repo's .gitignore and the caller's own glob, and a
 * silent default would let a call site quietly scan a different tree than every other one.
 * Directories are excluded by default (`nodir: true`); a caller that wants them back passes
 * `nodir: false` explicitly. Drops the dead v7 callback-API fallback none of the three copies'
 * v10 install ever reaches, and adds the try/catch none of them had — a bad pattern or an
 * unreadable `cwd` now surfaces as a wrapped Error naming the pattern, instead of an unhandled
 * rejection from inside the npm package.
 *
 * USAGE:
 * await glob('**\/*.ts', { cwd: '/repo', ignore: ['**\/node_modules/**'] });
 * // Returns absolute plain string paths, directories excluded
 */
import { glob as pkgGlob } from 'glob';

export const glob = async (
  pattern: string | string[],
  options: { cwd?: string; nodir?: boolean; ignore: readonly string[] },
): Promise<string[]> => {
  try {
    return await pkgGlob(pattern, {
      ...(options.cwd === undefined ? {} : { cwd: options.cwd }),
      absolute: true,
      nodir: options.nodir ?? true,
      ignore: [...options.ignore],
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`glob failed for pattern ${JSON.stringify(pattern)}: ${reason}`, {
      cause: error,
    });
  }
};
