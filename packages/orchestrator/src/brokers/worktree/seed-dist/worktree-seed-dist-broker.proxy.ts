import { CpNotInstalledErrorProxy } from '#gateway/bin/cp/cp-run/cp-not-installed.error.proxy';
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
  setupPackagesDirAbsent: (params: { repoRoot: string }) => void;
  setupPackages: (params: {
    repoRoot: string;
    worktreePath: string;
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
    setupPackagesDirAbsent: ({ repoRoot }: { repoRoot: string }): void => {
      isAccessibleProxy.missing({ path: `${repoRoot}/packages` });
    },

    setupPackages: ({
      repoRoot,
      worktreePath,
      packages,
    }: {
      repoRoot: string;
      worktreePath: string;
      packages: {
        name: string;
        isPackage?: boolean;
        hasSourceDist: boolean;
        hasTargetDist: boolean;
      }[];
    }): void => {
      isAccessibleProxy.present({ path: `${repoRoot}/packages` });
      // A name like `@gateway/node` lives inside a scope folder: `packages/` lists the scope, the
      // scope has no manifest of its own, and the scope's own listing holds the package.
      const topLevelNames = [...new Set(packages.map(({ name }) => name.split('/')[0] ?? name))];
      readdirProxy.returns({
        path: `${repoRoot}/packages`,
        entries: topLevelNames.map((name) => ({ name, kind: 'directory' as const })),
      });
      topLevelNames
        .filter((scope) => packages.some(({ name }) => name.startsWith(`${scope}/`)))
        .forEach((scope) => {
          isAccessibleProxy.missing({ path: `${repoRoot}/packages/${scope}/package.json` });
          readdirProxy.returns({
            path: `${repoRoot}/packages/${scope}`,
            entries: packages
              .filter(({ name }) => name.startsWith(`${scope}/`))
              .map(({ name }) => ({
                name: name.slice(scope.length + 1),
                kind: 'directory' as const,
              })),
          });
        });

      packages.forEach(({ name, isPackage, hasSourceDist, hasTargetDist }) => {
        const manifestPath = `${repoRoot}/packages/${name}/package.json`;
        const sourceDistPath = `${repoRoot}/packages/${name}/dist`;
        const targetDistPath = `${worktreePath}/packages/${name}/dist`;
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
