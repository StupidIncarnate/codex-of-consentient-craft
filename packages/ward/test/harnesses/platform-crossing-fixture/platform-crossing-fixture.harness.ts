import type { InstallTestbed } from '@dungeonmaster/testing';

/**
 * Builds the shared pieces of a fake monorepo `platformCrossingCheckBroker`'s own fixture tests
 * write onto a real `installTestbedCreateBroker` testbed: the workspaces root (listing both
 * `packages/*` and the `packages/@gateway/*` group folder, mirroring this repo's own root
 * `package.json`), a `frontend-react` `web` package carrying the same `#gateway/*` -> `@dungeonmaster/*`
 * `imports` field every real consumer package has, and the `@dungeonmaster/node`/`@dungeonmaster/browser`
 * gateway packages' own `package.json` under `packages/@gateway/<folder>` (never any of their files —
 * the check flags the import SPECIFIER, so it never needs to resolve into the gateway package itself).
 */
export const platformCrossingFixtureHarness = (): {
  writeFile: (params: {
    testbed: InstallTestbed;
    relativePath: string;
    content: string;
  }) => Promise<void>;
  writeWorkspacesRoot: (params: { testbed: InstallTestbed }) => Promise<void>;
  writeWebPackage: (params: { testbed: InstallTestbed }) => Promise<void>;
  writeNodeGatewayPackage: (params: { testbed: InstallTestbed }) => Promise<void>;
  writeBrowserGatewayPackage: (params: { testbed: InstallTestbed }) => Promise<void>;
} => ({
  writeFile: async ({
    testbed,
    relativePath,
    content,
  }: {
    testbed: InstallTestbed;
    relativePath: string;
    content: string;
  }): Promise<void> => {
    await Promise.resolve();
    testbed.writeFile({
      relativePath,
      content,
    });
  },

  writeWorkspacesRoot: async ({ testbed }: { testbed: InstallTestbed }): Promise<void> => {
    await Promise.resolve();
    testbed.writeFile({
      relativePath: 'package.json',
      content: JSON.stringify({ name: 'root', workspaces: ['packages/*', 'packages/@gateway/*'] }),
    });
  },

  writeWebPackage: async ({ testbed }: { testbed: InstallTestbed }): Promise<void> => {
    await Promise.resolve();
    testbed.writeFile({
      relativePath: 'packages/web/package.json',
      content: JSON.stringify({
        name: 'web',
        dependencies: { react: '18.2.0' },
        imports: {
          '#gateway/npm/*': '@dungeonmaster/npm/*',
          '#gateway/node/*': '@dungeonmaster/node/*',
          '#gateway/browser/*': '@dungeonmaster/browser/*',
          '#gateway/bin/*': '@dungeonmaster/bin/*',
        },
      }),
    });
    testbed.writeFile({
      relativePath: 'packages/web/src/widgets/.gitkeep',
      content: '',
    });
  },

  writeNodeGatewayPackage: async ({ testbed }: { testbed: InstallTestbed }): Promise<void> => {
    await Promise.resolve();
    testbed.writeFile({
      relativePath: 'packages/@gateway/node/package.json',
      content: JSON.stringify({ name: '@dungeonmaster/node' }),
    });
    // packageReadLayerBroker only registers a workspace package that has a src/ directory — a real
    // node gateway package always does (that is where every wrapped subpath's `index.ts` lives), so
    // the fixture needs the same marker for `workspaceDiscoverBroker` to discover this one too.
    testbed.writeFile({
      relativePath: 'packages/@gateway/node/src/.gitkeep',
      content: '',
    });
  },

  writeBrowserGatewayPackage: async ({ testbed }: { testbed: InstallTestbed }): Promise<void> => {
    await Promise.resolve();
    testbed.writeFile({
      relativePath: 'packages/@gateway/browser/package.json',
      content: JSON.stringify({ name: '@dungeonmaster/browser' }),
    });
    testbed.writeFile({
      relativePath: 'packages/@gateway/browser/src/.gitkeep',
      content: '',
    });
  },
});
