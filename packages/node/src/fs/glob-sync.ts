/**
 * PURPOSE: Wraps Node's own `fs.globSync`. No default ignore list is built in — a caller that
 * needs `node_modules` or `.git` excluded passes `exclude` itself, because a silent default would
 * hide matches a caller explicitly asked for.
 *
 * USAGE:
 * globSync({ patterns: '**\/*.ts', cwd: '/repo/packages/node/src' });
 * // Returns every matching path, relative to cwd
 */
import { globSync as nodeGlobSync } from 'fs';

export const globSync = ({
  patterns,
  cwd,
  exclude,
}: {
  patterns: string | string[];
  cwd?: string;
  exclude?: string[] | ((path: string) => boolean);
}): string[] =>
  nodeGlobSync(patterns, {
    ...(cwd === undefined ? {} : { cwd }),
    ...(exclude === undefined ? {} : { exclude }),
  });
