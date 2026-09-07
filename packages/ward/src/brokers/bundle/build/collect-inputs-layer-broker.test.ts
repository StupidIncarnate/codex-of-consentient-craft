import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { collectInputsLayerBroker } from './collect-inputs-layer-broker';
import { collectInputsLayerBrokerProxy } from './collect-inputs-layer-broker.proxy';

describe('collectInputsLayerBroker', () => {
  describe('a workspace with a dependency and a devDependency', () => {
    it('VALID: {web depends on shared} => returns the lockfile plus both packages, workspace-relative', async () => {
      const web = AbsoluteFilePathStub({ value: '/project/packages/web' });
      const shared = AbsoluteFilePathStub({ value: '/project/packages/shared' });
      const testing = AbsoluteFilePathStub({ value: '/project/packages/testing' });
      const proxy = collectInputsLayerBrokerProxy();
      proxy.setupWorkspaceRoot({
        packageDirs: ['shared', 'testing', 'web'],
        packageNames: ['@dm/shared', '@dm/testing', '@dm/web'],
      });
      proxy.setupPackage({
        packageRoot: shared,
        name: '@dm/shared',
        dependencies: [],
        sourceFiles: ['src/statics.ts'],
        isBundled: false,
      });
      proxy.setupUnbundledNeighbour({
        packageRoot: testing,
        name: '@dm/testing',
        dependencies: ['@dm/shared'],
      });
      proxy.setupPackage({
        packageRoot: web,
        name: '@dm/web',
        dependencies: ['@dm/shared'],
        sourceFiles: ['src/app.tsx'],
        isBundled: true,
      });

      const result = await collectInputsLayerBroker({ packageRoot: web });

      expect(result).toStrictEqual({
        repoRoot: '/project',
        relativePaths: [
          'package-lock.json',
          'packages/shared/src/statics.ts',
          'packages/web/src/app.tsx',
          'packages/web/index.html',
        ],
      });
    });

    // `@dm/testing` is staged with a manifest and a src/ but with NO globs. If the closure walk
    // followed devDependencies it would glob there, and the unstaged call throws — which is the
    // only way this assertion can tell "not reached" from "reached and empty".
    it('VALID: {testing reachable only as a devDependency} => never globs it', async () => {
      const web = AbsoluteFilePathStub({ value: '/project/packages/web' });
      const shared = AbsoluteFilePathStub({ value: '/project/packages/shared' });
      const testing = AbsoluteFilePathStub({ value: '/project/packages/testing' });
      const proxy = collectInputsLayerBrokerProxy();
      proxy.setupWorkspaceRoot({
        packageDirs: ['shared', 'testing', 'web'],
        packageNames: ['@dm/shared', '@dm/testing', '@dm/web'],
      });
      proxy.setupPackage({
        packageRoot: shared,
        name: '@dm/shared',
        dependencies: [],
        sourceFiles: ['src/statics.ts'],
        isBundled: false,
      });
      proxy.setupUnbundledNeighbour({
        packageRoot: testing,
        name: '@dm/testing',
        dependencies: ['@dm/shared'],
      });
      proxy.setupPackage({
        packageRoot: web,
        name: '@dm/web',
        dependencies: ['@dm/shared'],
        sourceFiles: ['src/app.tsx'],
        isBundled: true,
      });

      const { relativePaths } = await collectInputsLayerBroker({ packageRoot: web });
      const testingPaths = relativePaths.filter((path) =>
        String(path).startsWith('packages/testing/'),
      );

      expect(testingPaths).toStrictEqual([]);
    });
  });

  describe('transitive reach', () => {
    it('VALID: {web -> shared -> core} => includes the package two hops away', async () => {
      const web = AbsoluteFilePathStub({ value: '/project/packages/web' });
      const shared = AbsoluteFilePathStub({ value: '/project/packages/shared' });
      const core = AbsoluteFilePathStub({ value: '/project/packages/core' });
      const proxy = collectInputsLayerBrokerProxy();
      proxy.setupWorkspaceRoot({
        packageDirs: ['core', 'shared', 'web'],
        packageNames: ['@dm/core', '@dm/shared', '@dm/web'],
      });
      proxy.setupPackage({
        packageRoot: core,
        name: '@dm/core',
        dependencies: [],
        sourceFiles: ['src/core.ts'],
        isBundled: false,
      });
      proxy.setupPackage({
        packageRoot: shared,
        name: '@dm/shared',
        dependencies: ['@dm/core'],
        sourceFiles: ['src/statics.ts'],
        isBundled: false,
      });
      proxy.setupPackage({
        packageRoot: web,
        name: '@dm/web',
        dependencies: ['@dm/shared'],
        sourceFiles: ['src/app.tsx'],
        isBundled: true,
      });

      const { relativePaths } = await collectInputsLayerBroker({ packageRoot: web });

      expect(relativePaths).toStrictEqual([
        'package-lock.json',
        'packages/core/src/core.ts',
        'packages/shared/src/statics.ts',
        'packages/web/src/app.tsx',
        'packages/web/index.html',
      ]);
    });
  });

  describe('a repo with no workspaces', () => {
    it('VALID: {a single-package repo} => hashes the package itself against its own root', async () => {
      const solo = AbsoluteFilePathStub({ value: '/solo' });
      const proxy = collectInputsLayerBrokerProxy();
      // The manifest this stages declares no `workspaces`, and nothing above /solo declares any
      // either, so the workspace walk answers null and the package is its own root.
      proxy.setupPackage({
        packageRoot: solo,
        name: 'solo',
        dependencies: [],
        sourceFiles: ['src/index.ts'],
        isBundled: true,
      });

      const result = await collectInputsLayerBroker({ packageRoot: solo });

      expect(result).toStrictEqual({
        repoRoot: '/solo',
        relativePaths: ['package-lock.json', 'src/index.ts', 'index.html'],
      });
    });
  });
});
