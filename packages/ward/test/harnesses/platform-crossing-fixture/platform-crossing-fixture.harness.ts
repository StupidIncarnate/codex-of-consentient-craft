import { RelativePathStub, FileContentStub } from '@dungeonmaster/testing';
import type { InstallTestbed } from '@dungeonmaster/testing';

/**
 * Builds the shared pieces of a fake monorepo `platformCrossingCheckBroker`'s own fixture tests
 * write onto a real `installTestbedCreateBroker` testbed: the workspaces root, a `frontend-react`
 * `web` package, and the `@dungeonmaster/node` gateway package's own `package.json` (never any of
 * its files — the check flags the import SPECIFIER, so it never needs to resolve into the gateway
 * package itself).
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
      relativePath: RelativePathStub({ value: relativePath }),
      content: FileContentStub({ value: content }),
    });
  },

  writeWorkspacesRoot: async ({ testbed }: { testbed: InstallTestbed }): Promise<void> => {
    await Promise.resolve();
    testbed.writeFile({
      relativePath: RelativePathStub({ value: 'package.json' }),
      content: FileContentStub({
        value: JSON.stringify({ name: 'root', workspaces: ['packages/*'] }),
      }),
    });
  },

  writeWebPackage: async ({ testbed }: { testbed: InstallTestbed }): Promise<void> => {
    await Promise.resolve();
    testbed.writeFile({
      relativePath: RelativePathStub({ value: 'packages/web/package.json' }),
      content: FileContentStub({
        value: JSON.stringify({ name: 'web', dependencies: { react: '18.2.0' } }),
      }),
    });
    testbed.writeFile({
      relativePath: RelativePathStub({ value: 'packages/web/src/widgets/.gitkeep' }),
      content: FileContentStub({ value: '' }),
    });
  },

  writeNodeGatewayPackage: async ({ testbed }: { testbed: InstallTestbed }): Promise<void> => {
    await Promise.resolve();
    testbed.writeFile({
      relativePath: RelativePathStub({ value: 'packages/node/package.json' }),
      content: FileContentStub({ value: JSON.stringify({ name: '@dungeonmaster/node' }) }),
    });
  },
});
