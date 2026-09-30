/**
 * PURPOSE: Builds candidate fallback file paths by walking up parent directories from a cwd
 *
 * USAGE:
 * const paths = eslintFallbackPathsBroker({ cwd: '/project/.test-tmp/foo' });
 * // Returns ['/project/.test-tmp/foo/fallback.ts', '/project/.test-tmp/fallback.ts', '/project/fallback.ts', ...]
 */
import { resolve } from '#gateway/node/path';

const MAX_DEPTH = 10;

export const eslintFallbackPathsBroker = ({ cwd }: { cwd: string }): string[] => {
  const paths: string[] = [];
  let currentDir: string = cwd;
  for (let depth = 0; depth < MAX_DEPTH; depth++) {
    paths.push(resolve(currentDir, 'fallback.ts'));
    const parentDir = resolve(currentDir, '..');
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }
  return paths;
};
