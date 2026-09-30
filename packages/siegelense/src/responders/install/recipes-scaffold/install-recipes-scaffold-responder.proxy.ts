import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { basename, dirname, resolve } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { recipesScaffoldState } from '../../../state/recipes-scaffold/recipes-scaffold-state';
import { recipesScaffoldStateProxy } from '../../../state/recipes-scaffold/recipes-scaffold-state.proxy';
import { InstallRecipesScaffoldResponder } from './install-recipes-scaffold-responder';

// Every caller in these tests exercises targetProjectRoot: '/project' (the real, unstaged
// resolve passthrough resolves it to these exact paths), so every test lands on these paths.
const RECIPES_PACKAGE_PATH = '/project/packages/hydration-recipes';
const ROOT_PACKAGE_JSON_PATH = '/project/package.json';

const RECIPES_PACKAGE_ROOT = '/project/packages/hydration-recipes';
const SCAFFOLD_RELATIVE_PATHS = [
  'package.json',
  'tsconfig.json',
  'tsconfig.build.json',
  'jest.config.js',
  'src/responders/responders.ts',
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
  `${RECIPES_PACKAGE_ROOT}/src/responders`,
  `${RECIPES_PACKAGE_ROOT}/src/responders/recipes/listing`,
  `${RECIPES_PACKAGE_ROOT}/src/responders/recipes/seed`,
] as const;

const SCAFFOLD_FILE_ABSOLUTE_PATHS: ReadonlyMap<
  string,
  string
> = new Map(
  SCAFFOLD_RELATIVE_PATHS.map((relativePath) => [
    relativePath,
    `${RECIPES_PACKAGE_ROOT}/${relativePath}`,
  ]),
);

export const InstallRecipesScaffoldResponderProxy = (): {
  callResponder: typeof InstallRecipesScaffoldResponder;
  setupPackageAbsent: (params?: {
    rootPackageJsonPresent?: boolean;
    rootPackageJsonName?: string;
  }) => void;
  setupPackagePresent: () => void;
  getCreatedDirs: () => readonly unknown[];
  getWrittenContents: (params: { relativePath: string }) => unknown;
  getMarkedScaffoldedRecipesPackageName: () => string | undefined;
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
  const writeProxy = writeFileProxy();
  const recipesStateProxy = recipesScaffoldStateProxy();

  return {
    callResponder: InstallRecipesScaffoldResponder,

    // Neither packages/hydration-recipes/ nor its src/ exist yet — the fresh-install case. When
    // `rootPackageJsonName` is given, the target repo's own root package.json exists and carries it
    // as its `name` field (workspace-scope detection reads that field, never a dependency list);
    // `rootPackageJsonPresent: true` with no name stages a root package.json that HAS no `name` key
    // at all — the same "derive nothing" shape as it being absent entirely, but exercised through
    // the real parse path instead of the existence check. Clears recipesScaffoldState first, so a
    // test reads only what THIS responder call marked.
    setupPackageAbsent: ({
      rootPackageJsonPresent,
      rootPackageJsonName,
    }: {
      rootPackageJsonPresent?: boolean;
      rootPackageJsonName?: string;
    } = {}): void => {
      recipesStateProxy.setupEmpty();
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
        writeProxy.succeeds({ path: filePath });
      }
    },

    // The package already exists — real or seeded by a prior install. Nothing under it is read
    // or written, so no mkdir staging is needed: an attempted call fails the test on its own.
    setupPackagePresent: (): void => {
      recipesStateProxy.setupEmpty();
      existsProxy.returns({ path: RECIPES_PACKAGE_PATH, exists: true });
    },

    getCreatedDirs: (): readonly unknown[] =>
      SCAFFOLD_DIR_PATHS.flatMap((dirPath) =>
        mkdirProxy.getCallsFor({ path: dirPath }).map(() => dirPath),
      ),

    getWrittenContents: ({ relativePath }: { relativePath: string }): unknown => {
      const filePath = SCAFFOLD_FILE_ABSOLUTE_PATHS.get(relativePath);
      return filePath === undefined ? undefined : writeProxy.writtenContentsFor({ path: filePath });
    },

    // Reads recipesScaffoldState directly rather than exposing a semantic "was it marked" boolean
    // — the test needs the actual package NAME the responder marked, to prove the scope-detected
    // value (not just any value) reached the state. Draining here doubles as end-of-test cleanup:
    // a test that calls this leaves the state empty for whichever test runs next in this file.
    getMarkedScaffoldedRecipesPackageName: (): string | undefined =>
      recipesScaffoldState.consumeScaffolded().recipesPackageName,
  };
};
