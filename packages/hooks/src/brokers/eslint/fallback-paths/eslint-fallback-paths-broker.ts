/**
 * PURPOSE: Builds candidate fallback file paths by walking up parent directories from a cwd
 *
 * USAGE:
 * const paths = eslintFallbackPathsBroker({ cwd: '/project/.test-tmp/foo' });
 * // Returns ['/project/.test-tmp/foo/fallback.ts', '/project/.test-tmp/fallback.ts', '/project/fallback.ts', ...]
 */
import { resolve } from '#gateway/node/path';
import { filePathContract, type FilePath } from '../../../contracts/file-path/file-path-contract';

const MAX_DEPTH = 10;

export const eslintFallbackPathsBroker = ({ cwd }: { cwd: FilePath }): FilePath[] => {
  const paths: FilePath[] = [];
  let currentDir: FilePath = cwd;
  for (let depth = 0; depth < MAX_DEPTH; depth++) {
    paths.push(filePathContract.parse(resolve(currentDir, 'fallback.ts')));
    const parentDir = filePathContract.parse(resolve(currentDir, '..'));
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }
  return paths;
};
