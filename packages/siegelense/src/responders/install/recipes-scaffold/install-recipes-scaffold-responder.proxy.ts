import {
  fsExistsSyncAdapterProxy,
  fsMkdirAdapterProxy,
  pathResolveAdapterProxy,
} from '@dungeonmaster/shared/testing';
import {
  AbsoluteFilePathStub,
  FilePathStub,
  PathSegmentStub,
} from '@dungeonmaster/shared/contracts';
import type { PathSegment } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { InstallRecipesScaffoldResponder } from './install-recipes-scaffold-responder';

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
  setupPackageAbsent: (params?: { rootDependencies?: Record<string, string> }) => void;
  setupPackagePresent: () => void;
  getCreatedDirs: () => readonly unknown[];
  getWrittenContents: (params: { relativePath: PathSegment }) => unknown;
} => {
  pathResolveAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  const readProxy = fsReadFileAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  return {
    callResponder: InstallRecipesScaffoldResponder,

    // Neither packages/hydration-recipes/ nor its src/ exist yet — the fresh-install case. When
    // `rootDependencies` is given, the target repo's own root package.json exists and carries them
    // (workspace-scope detection reads it); when omitted, no root package.json exists at all.
    setupPackageAbsent: ({
      rootDependencies,
    }: { rootDependencies?: Record<string, string> } = {}): void => {
      existsProxy.returns({ filePath: RECIPES_PACKAGE_PATH, result: false });
      mkdirProxy.succeeds({ filepath: RECIPES_SRC_PATH });

      existsProxy.returns({
        filePath: ROOT_PACKAGE_JSON_PATH,
        result: rootDependencies !== undefined,
      });
      if (rootDependencies !== undefined) {
        readProxy.resolves({
          filePath: ROOT_PACKAGE_JSON_ABSOLUTE_PATH,
          content: JSON.stringify({ dependencies: rootDependencies }),
        });
      }

      for (const filePath of SCAFFOLD_FILE_ABSOLUTE_PATHS.values()) {
        writeProxy.succeeds({ filePath });
      }
    },

    // The package already exists — real or seeded by a prior install. Nothing under it is read
    // or written, so no mkdir staging is needed: an attempted call fails the test on its own.
    setupPackagePresent: (): void => {
      existsProxy.returns({ filePath: RECIPES_PACKAGE_PATH, result: true });
    },

    getCreatedDirs: (): readonly unknown[] => mkdirProxy.getCreatedDirs(),

    getWrittenContents: ({ relativePath }: { relativePath: PathSegment }): unknown => {
      const filePath = SCAFFOLD_FILE_ABSOLUTE_PATHS.get(relativePath);
      return filePath === undefined ? undefined : writeProxy.getWrittenFor({ filePath });
    },
  };
};
