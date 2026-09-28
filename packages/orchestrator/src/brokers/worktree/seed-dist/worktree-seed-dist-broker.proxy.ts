import {
  AbsoluteFilePathStub,
  FilePathStub,
  type AbsoluteFilePath,
} from '@dungeonmaster/shared/contracts';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { RunNotFoundErrorProxy } from '#gateway/node/child_process/run-not-found.error.proxy';
import { runProxy } from '#gateway/node/child_process/run/run.proxy';
import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import { join } from '#gateway/node/path';

import { fsIsAccessibleAdapterProxy } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter.proxy';

const COPY_COMMAND = 'cp';

export const worktreeSeedDistBrokerProxy = (): {
  setupPackagesDirAbsent: () => void;
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
  const isAccessibleProxy = fsIsAccessibleAdapterProxy();
  // "Nothing is there" is the honest default: an undescribed path has not been built, and every
  // path a test does describe outranks this catch-all.
  isAccessibleProxy.defaultsToNotFound();
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
    setupPackagesDirAbsent: (): void => {
      isAccessibleProxy.defaultsToNotFound();
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
      isAccessibleProxy.resolves({
        filePath: FilePathStub({ value: `${String(repoRoot)}/packages` }),
      });
      readdirProxy.returns({
        path: AbsoluteFilePathStub({ value: `${String(repoRoot)}/packages` }),
        entries: packages.map(({ name }) => ({ name, kind: 'directory' as const })),
      });

      packages.forEach(({ name, isPackage, hasSourceDist, hasTargetDist }) => {
        if (isPackage !== false) {
          isAccessibleProxy.resolves({
            filePath: FilePathStub({ value: `${String(repoRoot)}/packages/${name}/package.json` }),
          });
        }
        if (hasSourceDist) {
          isAccessibleProxy.resolves({
            filePath: FilePathStub({ value: `${String(repoRoot)}/packages/${name}/dist` }),
          });
        }
        if (hasTargetDist) {
          isAccessibleProxy.resolves({
            filePath: FilePathStub({
              value: `${String(worktreePath)}/packages/${name}/dist`,
            }),
          });
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
