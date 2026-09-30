/**
 * PURPOSE: Puts a fake `dungeonmaster` executable in a throwaway directory and hands back a PATH
 * value that finds it, so an integration test of the post-bash hook proves the hook really spawned
 * `dungeonmaster gateway-sync`, in which directory, and what reached its stdout, without the real
 * CLI touching any repo. Also creates the project directory the hook payload names as its cwd.
 *
 * USAGE:
 * const fakeBin = fakeDungeonmasterBinHarness();
 * const projectDir = await fakeBin.createProjectDir();
 * const pathValue = await fakeBin.withSucceedingSync();
 * runner.runHook({ hookName: 'start-post-bash-hook', hookData, env: { PATH: pathValue } });
 * // The fake prints 'fake gateway-sync cwd=<projectDir> args=gateway-sync'
 */
import { chmodSync, rmSync } from '#gateway/node/fs';
import { mkdtemp, realpath, writeFile } from '#gateway/node/fs__promises';
import { tmpdir } from '#gateway/node/os';
import { join } from '#gateway/node/path';
import { getEnv } from '#gateway/node/process';

const EXECUTABLE_MODE = 0o755;

export const fakeDungeonmasterBinHarness = (): {
  afterEach: () => void;
  createProjectDir: () => Promise<string>;
  withSucceedingSync: () => Promise<string>;
  withFailingSync: () => Promise<string>;
  withNoDungeonmasterOnPath: () => Promise<string>;
} => {
  const createdDirs: string[] = [];

  const makeDir = async ({ prefix }: { prefix: string }): Promise<string> => {
    const dir = await realpath(await mkdtemp(join(tmpdir(), prefix)));
    createdDirs.push(dir);
    return dir;
  };

  const installFake = async ({ script }: { script: string }): Promise<string> => {
    const binDir = await makeDir({ prefix: 'dm-fake-bin-' });
    const binPath = join(binDir, 'dungeonmaster');
    await writeFile(binPath, script);
    chmodSync(binPath, EXECUTABLE_MODE);
    return `${binDir}:${getEnv('PATH') ?? ''}`;
  };

  return {
    afterEach: (): void => {
      createdDirs.forEach((dir) => {
        rmSync(dir, { recursive: true, force: true });
      });
      createdDirs.length = 0;
    },

    createProjectDir: async (): Promise<string> => makeDir({ prefix: 'dm-post-bash-project-' }),

    withSucceedingSync: async (): Promise<string> =>
      installFake({ script: '#!/bin/sh\necho "fake gateway-sync cwd=$(pwd -P) args=$*"\n' }),

    withFailingSync: async (): Promise<string> =>
      installFake({ script: '#!/bin/sh\necho "fake gateway-sync blew up" >&2\nexit 3\n' }),

    withNoDungeonmasterOnPath: async (): Promise<string> => makeDir({ prefix: 'dm-empty-path-' }),
  };
};
