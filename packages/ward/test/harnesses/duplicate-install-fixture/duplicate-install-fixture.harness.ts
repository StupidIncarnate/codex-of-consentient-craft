import type { InstallTestbed } from '@dungeonmaster/testing';

/**
 * Builds the shared pieces of a fake monorepo `duplicateInstallCheckBroker`'s own fixture tests write
 * onto a real `installTestbedCreateBroker` testbed: the workspaces root (listing both `packages/*`
 * and the `packages/@gateway/*` group folder, mirroring this repo's own root `package.json`), a
 * `packages/@gateway/<folder>` gateway package carrying its own `dependencies`/`peerDependencies`,
 * an ordinary workspace package, and an installed copy's `package.json` at some `node_modules/<name>`
 * directory — the only fields `duplicateInstallCheckBroker` ever reads off any of them.
 */
export const duplicateInstallFixtureHarness = (): {
  writeWorkspacesRoot: (params: { testbed: InstallTestbed }) => Promise<void>;
  writeGatewayPackage: (params: {
    testbed: InstallTestbed;
    folder: string;
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  }) => Promise<void>;
  writeWorkspacePackage: (params: {
    testbed: InstallTestbed;
    relativePath: string;
    name: string;
  }) => Promise<void>;
  writeInstalledPackage: (params: {
    testbed: InstallTestbed;
    relativeDir: string;
    version: string;
  }) => Promise<void>;
} => ({
  writeWorkspacesRoot: async ({ testbed }: { testbed: InstallTestbed }): Promise<void> => {
    await Promise.resolve();
    testbed.writeFile({
      relativePath: 'package.json',
      content: JSON.stringify({ name: 'root', workspaces: ['packages/*', 'packages/@gateway/*'] }),
    });
  },

  writeGatewayPackage: async ({
    testbed,
    folder,
    dependencies,
    peerDependencies,
  }: {
    testbed: InstallTestbed;
    folder: string;
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  }): Promise<void> => {
    await Promise.resolve();
    testbed.writeFile({
      relativePath: `packages/@gateway/${folder}/package.json`,
      content: JSON.stringify({ name: `@dungeonmaster/${folder}`, dependencies, peerDependencies }),
    });
    // packageReadLayerBroker only registers a workspace package that has a src/ directory.
    testbed.writeFile({
      relativePath: `packages/@gateway/${folder}/src/.gitkeep`,
      content: '',
    });
  },

  writeWorkspacePackage: async ({
    testbed,
    relativePath,
    name,
  }: {
    testbed: InstallTestbed;
    relativePath: string;
    name: string;
  }): Promise<void> => {
    await Promise.resolve();
    testbed.writeFile({
      relativePath: `${relativePath}/package.json`,
      content: JSON.stringify({ name }),
    });
    testbed.writeFile({
      relativePath: `${relativePath}/src/.gitkeep`,
      content: '',
    });
  },

  writeInstalledPackage: async ({
    testbed,
    relativeDir,
    version,
  }: {
    testbed: InstallTestbed;
    relativeDir: string;
    version: string;
  }): Promise<void> => {
    await Promise.resolve();
    testbed.writeFile({
      relativePath: `${relativeDir}/package.json`,
      content: JSON.stringify({ version }),
    });
  },
});
