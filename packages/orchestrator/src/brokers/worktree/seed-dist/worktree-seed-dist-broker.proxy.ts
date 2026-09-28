import { AbsoluteFilePathStub, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { RunNotFoundErrorProxy } from '#gateway/node/child_process/run-not-found.error.proxy';
import { runProxy } from '#gateway/node/child_process/run/run.proxy';
import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { join } from '#gateway/node/path';

const COPY_COMMAND = 'cp';

export const worktreeSeedDistBrokerProxy = (): {
  setupPackagesDirAbsent: (params: { repoRoot: AbsoluteFilePath }) => void;
  setupPackages: (params: {
    repoRoot: AbsoluteFilePath;
    worktreePath: AbsoluteFilePath;
    packages: {
      name: string;
      isPackage?: boolean;
      hasSourceDist: boolean;
      hasTargetDist: boolean;
    }[];
  }) => void;
  setupCopySucceeds: () => void;
  setupCopyFails: (params: { output: string }) => void;
  getCopyArgs: () => unknown;
} => {
  const isAccessibleProxy = pathExistsProxy();
  const readdirProxy = readdirEntriesSyncProxy();
  const run = runProxy();
  // Created but unstaged: RunNotFoundError is a plain class with nothing to mock — composing its
  // proxy satisfies enforce-proxy-child-creation for the broker's own `instanceof` import.
  RunNotFoundErrorProxy();
  // `join` computes every source/target dist path purely from string arithmetic, and the setups
  // below describe their result by the REAL joined path, so the default stays a real passthrough
  // rather than staging every tuple individually.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));

  return {
    setupPackagesDirAbsent: ({ repoRoot }: { repoRoot: AbsoluteFilePath }): void => {
      isAccessibleProxy.missing({ path: `${String(repoRoot)}/packages` });
    },

    setupPackages: ({
      repoRoot,
      worktreePath,
      packages,
    }: {
      repoRoot: AbsoluteFilePath;
      worktreePath: AbsoluteFilePath;
      packages: {
        name: string;
        isPackage?: boolean;
        hasSourceDist: boolean;
        hasTargetDist: boolean;
      }[];
    }): void => {
      isAccessibleProxy.present({ path: `${String(repoRoot)}/packages` });
      readdirProxy.returns({
        path: AbsoluteFilePathStub({ value: `${String(repoRoot)}/packages` }),
        entries: packages.map(({ name }) => ({ name, kind: 'directory' as const })),
      });

      packages.forEach(({ name, isPackage, hasSourceDist, hasTargetDist }) => {
        const manifestPath = `${String(repoRoot)}/packages/${name}/package.json`;
        const sourceDistPath = `${String(repoRoot)}/packages/${name}/dist`;
        const targetDistPath = `${String(worktreePath)}/packages/${name}/dist`;
        if (isPackage === false) {
          isAccessibleProxy.missing({ path: manifestPath });
        } else {
          isAccessibleProxy.present({ path: manifestPath });
        }
        if (hasSourceDist) {
          isAccessibleProxy.present({ path: sourceDistPath });
        } else {
          isAccessibleProxy.missing({ path: sourceDistPath });
        }
        if (hasTargetDist) {
          isAccessibleProxy.present({ path: targetDistPath });
        } else {
          isAccessibleProxy.missing({ path: targetDistPath });
        }
      });
    },

    setupCopySucceeds: (): void => {
      run.setupSuccess({ command: COPY_COMMAND, exitCode: 0, stdout: '', stderr: '' });
    },

    setupCopyFails: ({ output }: { output: string }): void => {
      run.setupSuccess({ command: COPY_COMMAND, exitCode: 1, stdout: '', stderr: output });
    },

    getCopyArgs: (): unknown => run.getCallsFor({ command: COPY_COMMAND }).at(-1),
  };
};
