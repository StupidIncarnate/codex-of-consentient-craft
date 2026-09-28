import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { basename, dirname, resolve } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import {
  AbsoluteFilePathStub,
  FilePathStub,
  PathSegmentStub,
  packageNameContract,
} from '@dungeonmaster/shared/contracts';
import type { PathSegment } from '@dungeonmaster/shared/contracts';

import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { npmInstallAdapterProxy } from '../../../adapters/npm/install/npm-install-adapter.proxy';
import { npmRunBuildAdapterProxy } from '../../../adapters/npm/run-build/npm-run-build-adapter.proxy';
import { InstallRecipesScaffoldResponder } from './install-recipes-scaffold-responder';

// pathBasenameAdapterProxy/pathDirnameAdapterProxy/pathResolveAdapterProxy formerly staged REAL
// passthrough defaults for basename/dirname/resolve; #gateway/node/path re-exports these bare (no
// per-function proxy of its own, unlike fs/fs__promises/child_process), so this file stages the
// same real-passthrough default directly on the gateway's own re-exports, matching
// instance-start-broker.proxy.ts's own `join` pattern (A12 SL7).
const FALLBACK_SCOPE = '@project';

// Every caller in these tests exercises targetProjectRoot: '/project' (the real, unstaged
// resolve passthrough resolves it to these exact paths), so every test lands on these paths.
const RECIPES_PACKAGE_PATH = FilePathStub({ value: '/project/packages/hydration-recipes' });
const ROOT_PACKAGE_JSON_PATH = FilePathStub({ value: '/project/package.json' });

const RECIPES_PACKAGE_ROOT = '/project/packages/hydration-recipes';
const SCAFFOLD_RELATIVE_PATHS = [
  'package.json',
  'tsconfig.json',
  'tsconfig.build.json',
  'jest.config.js',
  'responders.ts',
  'src/index.ts',
  'src/index.integration.test.ts',
  'src/startup/start-hydration-recipes.ts',
  'src/startup/start-hydration-recipes.integration.test.ts',
  'src/flows/recipes/recipes-flow.ts',
  'src/flows/recipes/recipes-flow.integration.test.ts',
  'src/responders/recipes/listing/recipes-listing-responder.ts',
  'src/responders/recipes/listing/recipes-listing-responder.proxy.ts',
  'src/responders/recipes/listing/recipes-listing-responder.test.ts',
  'src/responders/recipes/seed/recipes-seed-responder.ts',
  'src/responders/recipes/seed/recipes-seed-responder.proxy.ts',
  'src/responders/recipes/seed/recipes-seed-responder.test.ts',
] as const;

// The gateway fs__promises proxy has no catch-all: every directory the real code's own dirname()
// resolves must be staged by its exact path. Derived once, by hand, from SCAFFOLD_RELATIVE_PATHS
// above rather than by re-deriving it through a mocked dirname/resolve at proxy-construction time.
const SCAFFOLD_DIR_PATHS = [
  RECIPES_PACKAGE_ROOT,
  `${RECIPES_PACKAGE_ROOT}/src`,
  `${RECIPES_PACKAGE_ROOT}/src/startup`,
  `${RECIPES_PACKAGE_ROOT}/src/flows/recipes`,
  `${RECIPES_PACKAGE_ROOT}/src/responders/recipes/listing`,
  `${RECIPES_PACKAGE_ROOT}/src/responders/recipes/seed`,
] as const;

const SCAFFOLD_FILE_ABSOLUTE_PATHS: ReadonlyMap<
  PathSegment,
  ReturnType<typeof AbsoluteFilePathStub>
> = new Map(
  SCAFFOLD_RELATIVE_PATHS.map((relativePath) => [
    PathSegmentStub({ value: relativePath }),
    AbsoluteFilePathStub({ value: `${RECIPES_PACKAGE_ROOT}/${relativePath}` }),
  ]),
);

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
  const realPath = requireActual<{
    basename: typeof basename;
    dirname: typeof dirname;
    resolve: typeof resolve;
  }>({ module: 'path' });
  registerMock({ fn: resolve })
    .calledWith([])
    .implement((...segments: never[]) => realPath.resolve(...segments));
  registerMock({ fn: basename })
    .calledWith([])
    .implement((inputPath: never) => realPath.basename(inputPath));
  registerMock({ fn: dirname })
    .calledWith([])
    .implement((inputPath: never) => realPath.dirname(inputPath));

  const existsProxy = existsSyncProxy();
  const mkdirProxy = ensureDirProxy();
  // Every scaffold directory this responder ever ensureDirs is a known, fixed path (see
  // SCAFFOLD_DIR_PATHS above) — staged unconditionally so any scenario that reaches the write
  // phase succeeds; a scenario that returns before that phase (package present, install fails)
  // simply never calls these.
  for (const dirPath of SCAFFOLD_DIR_PATHS) {
    mkdirProxy.succeeds({ path: dirPath });
  }
  const readProxy = readFileProxy();
  const writeProxy = fsWriteFileAdapterProxy();
  const installProxy = npmInstallAdapterProxy();
  const buildProxy = npmRunBuildAdapterProxy();

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
      existsProxy.returns({ path: RECIPES_PACKAGE_PATH, exists: false });

      const rootPackageJsonExists =
        rootPackageJsonPresent === true || rootPackageJsonName !== undefined;
      existsProxy.returns({
        path: ROOT_PACKAGE_JSON_PATH,
        exists: rootPackageJsonExists,
      });
      if (rootPackageJsonExists) {
        readProxy.returns({
          path: ROOT_PACKAGE_JSON_PATH,
          contents: JSON.stringify(
            rootPackageJsonName === undefined ? {} : { name: rootPackageJsonName },
          ),
        });
      }

      for (const filePath of SCAFFOLD_FILE_ABSOLUTE_PATHS.values()) {
        writeProxy.succeeds({ filePath });
      }

      // Mirrors what the real responder resolves: absent root package.json => no scope at all;
      // present with no name => FALLBACK_SCOPE (the real basename passthrough); present with a
      // name => workspaceScopeFromRootNameTransformer's own two branches for that name.
      const resolvedScope = rootPackageJsonExists
        ? rootPackageJsonName === undefined || rootPackageJsonName.length === 0
          ? FALLBACK_SCOPE
          : rootPackageJsonName.startsWith('@')
            ? rootPackageJsonName.slice(0, rootPackageJsonName.indexOf('/'))
            : `@${rootPackageJsonName}`
        : undefined;
      const workspace = packageNameContract.parse(
        resolvedScope === undefined ? 'hydration-recipes' : `${resolvedScope}/hydration-recipes`,
      );

      installProxy.setupSuccess();
      buildProxy.setupSuccess({ workspace });
    },

    // The package already exists — real or seeded by a prior install. Nothing under it is read
    // or written, so no mkdir staging is needed: an attempted call fails the test on its own.
    setupPackagePresent: (): void => {
      existsProxy.returns({ path: RECIPES_PACKAGE_PATH, exists: true });
    },

    // Build is left unstaged: the responder must short-circuit on a failed install rather than
    // attempt to build a workspace `npm install` never linked into node_modules — an unstaged
    // build call throws "nothing set up", which fails the test if the short-circuit regresses.
    setupInstallFails: ({ output }: { output: string }): void => {
      installProxy.setupFailure({ output });
    },

    setupBuildFails: ({ output }: { output: string }): void => {
      buildProxy.setupFailure({
        workspace: packageNameContract.parse('hydration-recipes'),
        output,
      });
    },

    getCreatedDirs: (): readonly unknown[] =>
      SCAFFOLD_DIR_PATHS.flatMap((dirPath) =>
        mkdirProxy.getCallsFor({ path: dirPath }).map(() => dirPath),
      ),

    getWrittenContents: ({ relativePath }: { relativePath: PathSegment }): unknown => {
      const filePath = SCAFFOLD_FILE_ABSOLUTE_PATHS.get(relativePath);
      return filePath === undefined ? undefined : writeProxy.getWrittenFor({ filePath });
    },

    getInstallSpawnArgs: (): unknown => installProxy.getSpawnedArgs(),

    getBuildSpawnArgs: (): unknown => buildProxy.getSpawnedArgs(),

    wasInstallSpawnedFromCwd: ({ cwd }: { cwd: string }): boolean =>
      installProxy.getSpawnedCwd() === cwd,

    wasBuildSpawnedFromCwd: ({ cwd }: { cwd: string }): boolean =>
      buildProxy.getSpawnedCwd() === cwd,

    wasNpmSpawned: (): boolean =>
      installProxy.getSpawnedArgs() !== undefined || buildProxy.getSpawnedArgs() !== undefined,
  };
};
