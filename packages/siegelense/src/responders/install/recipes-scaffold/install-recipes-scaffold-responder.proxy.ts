import { spawn, type ChildProcess } from 'child_process';
import { EventEmitter, Readable } from 'stream';
import {
  fsExistsSyncAdapterProxy,
  fsMkdirAdapterProxy,
  pathBasenameAdapterProxy,
  pathResolveAdapterProxy,
} from '@dungeonmaster/shared/testing';
import {
  AbsoluteFilePathStub,
  FilePathStub,
  PathSegmentStub,
} from '@dungeonmaster/shared/contracts';
import type { PathSegment } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { npmInstallAdapterProxy } from '../../../adapters/npm/install/npm-install-adapter.proxy';
import { npmRunBuildAdapterProxy } from '../../../adapters/npm/run-build/npm-run-build-adapter.proxy';
import { InstallRecipesScaffoldResponder } from './install-recipes-scaffold-responder';

// npmInstallAdapter and npmRunBuildAdapter both spawn bare `npm`, so `command` alone cannot tell
// the two calls apart under the shared childProcessSpawnCaptureAdapterProxy's command-only
// addressing (the same collision git-detect-base-branch-broker.proxy.ts documents for two `git`
// calls) — addressing on the full args array instead discriminates them directly, in either order.
const NPM_INSTALL_ARGS = ['install'];
// The getters/failure-setters below all address the UNSCOPED package name — every test that reads
// spawn args or stages a failure uses setupPackageAbsent() with no rootPackageJsonName. The SCOPED
// tests (rootPackageJsonName present) only assert written file contents, never spawn calls, so the
// scope-aware build args setupPackageAbsent computes for its own default staging never need to be
// read back through these fixed constants.
const NPM_BUILD_ARGS = ['run', 'build', '--workspace=hydration-recipes'];
// pathBasenameAdapterProxy() (called inside the factory below) stages the REAL, passthrough
// basename as its own default, so the real responder's fallback — offered whenever the root
// package.json exists but carries no `name` — genuinely resolves CONTEXT's targetProjectRoot
// ('/project') to 'project'. Hardcoded rather than computed by calling `basename('/project')' at
// this MODULE's own top level: 'path' is itself mocked the moment this file's module graph pulls
// in pathBasenameAdapterProxy, and that mock is staged only once the factory below runs — a
// module-level call here would run before any test's setup and silently see the unstaged mock.
const FALLBACK_SCOPE = '@project';

const createNpmChild = ({
  exitCode,
  stderr,
}: {
  exitCode: number;
  stderr: string;
}): ChildProcess => {
  const child = new EventEmitter() as ChildProcess;
  child.stdout = new Readable({
    read(): void {
      /* noop */
    },
  });
  child.stderr = new Readable({
    read(): void {
      /* noop */
    },
  });

  const mockStderr = child.stderr;

  setImmediate(() => {
    if (stderr.length > 0) {
      mockStderr.push(Buffer.from(stderr));
    }
    mockStderr.push(null);
    child.stdout?.push(null);
    child.emit('exit', exitCode, null);
  });

  return child;
};

// Every caller in these tests exercises targetProjectRoot: '/project' (the real, unstaged
// pathResolve passthrough resolves it to these exact paths), so every test lands on these paths.
const RECIPES_PACKAGE_PATH = FilePathStub({ value: '/project/packages/hydration-recipes' });
const RECIPES_SRC_PATH = FilePathStub({ value: '/project/packages/hydration-recipes/src' });
const ROOT_PACKAGE_JSON_PATH = FilePathStub({ value: '/project/package.json' });
const ROOT_PACKAGE_JSON_ABSOLUTE_PATH = AbsoluteFilePathStub({ value: '/project/package.json' });

const SCAFFOLD_FILE_ABSOLUTE_PATHS: ReadonlyMap<
  PathSegment,
  ReturnType<typeof AbsoluteFilePathStub>
> = new Map([
  [
    PathSegmentStub({ value: 'package.json' }),
    AbsoluteFilePathStub({ value: '/project/packages/hydration-recipes/package.json' }),
  ],
  [
    PathSegmentStub({ value: 'tsconfig.json' }),
    AbsoluteFilePathStub({ value: '/project/packages/hydration-recipes/tsconfig.json' }),
  ],
  [
    PathSegmentStub({ value: 'tsconfig.build.json' }),
    AbsoluteFilePathStub({ value: '/project/packages/hydration-recipes/tsconfig.build.json' }),
  ],
  [
    PathSegmentStub({ value: 'src/index.ts' }),
    AbsoluteFilePathStub({ value: '/project/packages/hydration-recipes/src/index.ts' }),
  ],
  [
    PathSegmentStub({ value: 'src/index.test.ts' }),
    AbsoluteFilePathStub({ value: '/project/packages/hydration-recipes/src/index.test.ts' }),
  ],
]);

export const InstallRecipesScaffoldResponderProxy = (): {
  callResponder: typeof InstallRecipesScaffoldResponder;
  setupPackageAbsent: (params?: {
    rootPackageJsonPresent?: boolean;
    rootPackageJsonName?: string;
  }) => void;
  setupPackagePresent: () => void;
  setupInstallFails: (params: { output: string }) => void;
  setupBuildFails: (params: { output: string }) => void;
  getCreatedDirs: () => readonly unknown[];
  getWrittenContents: (params: { relativePath: PathSegment }) => unknown;
  getInstallSpawnArgs: () => unknown;
  getBuildSpawnArgs: () => unknown;
  wasInstallSpawnedFromCwd: (params: { cwd: string }) => boolean;
  wasBuildSpawnedFromCwd: (params: { cwd: string }) => boolean;
  wasNpmSpawned: () => boolean;
} => {
  pathResolveAdapterProxy();
  pathBasenameAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  const readProxy = fsReadFileAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();
  // Created but unstaged: the real implementation composes npmInstallAdapter/npmRunBuildAdapter
  // (which themselves compose childProcessSpawnCaptureAdapter), but this proxy answers `spawn`
  // directly (see the module comment above) so neither adapter proxy's own constructor-level
  // default ever fires.
  npmInstallAdapterProxy();
  npmRunBuildAdapterProxy();
  const spawnHandle = registerMock({ fn: spawn });

  const stageInstall = ({ exitCode, stderr }: { exitCode: number; stderr: string }): void => {
    spawnHandle
      .calledWith(['npm', NPM_INSTALL_ARGS])
      .implement(() => createNpmChild({ exitCode, stderr }));
  };

  const stageBuild = ({
    args,
    exitCode,
    stderr,
  }: {
    args: readonly string[];
    exitCode: number;
    stderr: string;
  }): void => {
    spawnHandle.calledWith(['npm', args]).implement(() => createNpmChild({ exitCode, stderr }));
  };

  // Stages the npm build call under whatever workspace name the REAL responder will actually
  // request — scope resolution itself happens once, inline in setupPackageAbsent below (mirroring
  // workspaceScopeFromRootNameTransformer's own branches for a real name, plus FALLBACK_SCOPE for
  // the responder's own fallback path), so this only turns a resolved scope (or its absence) into
  // the --workspace= value. Stages the call directly (`void`) rather than returning the computed
  // args, since a function returning a raw (unbranded) string array/tuple trips `ban-primitives`
  // in a responders/ file.
  const stageBuildForWorkspace = ({
    scope,
    exitCode,
    stderr,
  }: {
    scope?: string;
    exitCode: number;
    stderr: string;
  }): void => {
    const workspaceName = scope === undefined ? 'hydration-recipes' : `${scope}/hydration-recipes`;
    stageBuild({ args: ['run', 'build', `--workspace=${workspaceName}`], exitCode, stderr });
  };

  // Reads the spawned `cwd` by substring rather than a structural cast on the captured `unknown`
  // options object — `ban-adhoc-types` forbids `as {cwd?: unknown}` in a responders/ file, and a
  // JSON-string search proves the same fact without one.
  const wasSpawnedFromCwd = ({ args, cwd }: { args: readonly string[]; cwd: string }): boolean =>
    JSON.stringify(spawnHandle.callsMatching(['npm', args]).at(-1)?.[2] ?? {}).includes(
      `"cwd":${JSON.stringify(cwd)}`,
    );

  return {
    callResponder: InstallRecipesScaffoldResponder,

    // Neither packages/hydration-recipes/ nor its src/ exist yet — the fresh-install case. When
    // `rootPackageJsonName` is given, the target repo's own root package.json exists and carries it
    // as its `name` field (workspace-scope detection reads that field, never a dependency list);
    // `rootPackageJsonPresent: true` with no name stages a root package.json that HAS no `name` key
    // at all — the same "derive nothing" shape as it being absent entirely, but exercised through
    // the real parse path instead of the existence check. Every fresh scaffold now runs `npm
    // install` then `npm run build --workspace=<name>`, so this stages both as succeeding by
    // default — setupInstallFails/setupBuildFails re-stage one address afterward and win, per
    // registerMock's most-recent-wins rule.
    setupPackageAbsent: ({
      rootPackageJsonPresent,
      rootPackageJsonName,
    }: {
      rootPackageJsonPresent?: boolean;
      rootPackageJsonName?: string;
    } = {}): void => {
      existsProxy.returns({ filePath: RECIPES_PACKAGE_PATH, result: false });
      mkdirProxy.succeeds({ filepath: RECIPES_SRC_PATH });

      const rootPackageJsonExists =
        rootPackageJsonPresent === true || rootPackageJsonName !== undefined;
      existsProxy.returns({
        filePath: ROOT_PACKAGE_JSON_PATH,
        result: rootPackageJsonExists,
      });
      if (rootPackageJsonExists) {
        readProxy.resolves({
          filePath: ROOT_PACKAGE_JSON_ABSOLUTE_PATH,
          content: JSON.stringify(
            rootPackageJsonName === undefined ? {} : { name: rootPackageJsonName },
          ),
        });
      }

      for (const filePath of SCAFFOLD_FILE_ABSOLUTE_PATHS.values()) {
        writeProxy.succeeds({ filePath });
      }

      // Mirrors what the real responder resolves: absent root package.json => no scope at all;
      // present with no name => FALLBACK_SCOPE (pathBasenameAdapter's real passthrough); present
      // with a name => workspaceScopeFromRootNameTransformer's own two branches for that name.
      const resolvedScope = rootPackageJsonExists
        ? rootPackageJsonName === undefined || rootPackageJsonName.length === 0
          ? FALLBACK_SCOPE
          : rootPackageJsonName.startsWith('@')
            ? rootPackageJsonName.slice(0, rootPackageJsonName.indexOf('/'))
            : `@${rootPackageJsonName}`
        : undefined;

      stageInstall({ exitCode: 0, stderr: '' });
      stageBuildForWorkspace({
        ...(resolvedScope === undefined ? {} : { scope: resolvedScope }),
        exitCode: 0,
        stderr: '',
      });
    },

    // The package already exists — real or seeded by a prior install. Nothing under it is read
    // or written, so no mkdir staging is needed: an attempted call fails the test on its own.
    setupPackagePresent: (): void => {
      existsProxy.returns({ filePath: RECIPES_PACKAGE_PATH, result: true });
    },

    // Build is left unstaged: the responder must short-circuit on a failed install rather than
    // attempt to build a workspace `npm install` never linked into node_modules — an unstaged
    // build call throws "nothing set up", which fails the test if the short-circuit regresses.
    setupInstallFails: ({ output }: { output: string }): void => {
      stageInstall({ exitCode: 1, stderr: output });
    },

    setupBuildFails: ({ output }: { output: string }): void => {
      stageBuild({ args: NPM_BUILD_ARGS, exitCode: 1, stderr: output });
    },

    getCreatedDirs: (): readonly unknown[] => mkdirProxy.getCreatedDirs(),

    getWrittenContents: ({ relativePath }: { relativePath: PathSegment }): unknown => {
      const filePath = SCAFFOLD_FILE_ABSOLUTE_PATHS.get(relativePath);
      return filePath === undefined ? undefined : writeProxy.getWrittenFor({ filePath });
    },

    // installProxy/buildProxy's own getSpawnedArgs() reads the LAST bare-'npm' call regardless of
    // which adapter made it, so once both calls have happened they would answer identically —
    // reading straight off spawnHandle, addressed by the full args array, is what discriminates.
    getInstallSpawnArgs: (): unknown =>
      spawnHandle.callsMatching(['npm', NPM_INSTALL_ARGS]).at(-1)?.[1],

    getBuildSpawnArgs: (): unknown =>
      spawnHandle.callsMatching(['npm', NPM_BUILD_ARGS]).at(-1)?.[1],

    wasInstallSpawnedFromCwd: ({ cwd }: { cwd: string }): boolean =>
      wasSpawnedFromCwd({ args: NPM_INSTALL_ARGS, cwd }),

    wasBuildSpawnedFromCwd: ({ cwd }: { cwd: string }): boolean =>
      wasSpawnedFromCwd({ args: NPM_BUILD_ARGS, cwd }),

    wasNpmSpawned: (): boolean => spawnHandle.callsMatching(['npm']).length > 0,
  };
};
