import { CpNotInstalledErrorProxy } from '#gateway/bin/cp/cp-run/cp-not-installed.error.proxy';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts/absolute-file-path/absolute-file-path.stub';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { copyRecursiveProxy } from '#gateway/bin/cp/copy-recursive/copy-recursive.proxy';
import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { join } from '#gateway/node/path';

// Every copy this broker makes is one package's `dist` onto its worktree twin, so both sides of the
// address are the one structural fact every such path shares.
const isDistPath = (value: unknown): boolean =>
  typeof value === 'string' && value.endsWith('/dist');

// A recorded cp call is `[{ command, args, cwd }]`; the tests read back only its argv.
const copyArgsOf = (call: readonly unknown[]): unknown => {
  const [spawned] = call;
  return typeof spawned === 'object' && spawned !== null && 'args' in spawned
    ? spawned.args
    : undefined;
};

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
  CpNotInstalledErrorProxy();
  const isAccessibleProxy = pathExistsProxy();
  const readdirProxy = readdirEntriesSyncProxy();
  const copyChild = copyRecursiveProxy();
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
      copyChild.returnsMatchingDestination({
        sources: [isDistPath],
        destination: isDistPath,
        exitCode: 0,
        output: '',
      });
    },

    setupCopyFails: ({ output }: { output: string }): void => {
      copyChild.returnsMatchingDestination({
        sources: [isDistPath],
        destination: isDistPath,
        exitCode: 1,
        output,
      });
    },

    getCopyArgs: (): unknown => {
      const calls = copyChild.getCallsFor({ sources: [isDistPath], destination: isDistPath });
      const last = calls.at(-1);
      return last === undefined ? undefined : copyArgsOf(last);
    },
  };
};
