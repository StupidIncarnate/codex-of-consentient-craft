import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';

import { duplicateInstallCheckBroker } from './duplicate-install-check-broker';
import { duplicateInstallFixtureHarness } from '../../../../test/harnesses/duplicate-install-fixture/duplicate-install-fixture.harness';

describe('duplicateInstallCheckBroker (integration)', () => {
  const harness = duplicateInstallFixtureHarness();

  describe('single copy', () => {
    it('VALID: {a dependency installed at exactly one location} => reports nothing', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'duplicate-install-single-copy' }),
      });
      await harness.writeWorkspacesRoot({ testbed });
      await harness.writeGatewayPackage({
        testbed,
        folder: 'npm',
        dependencies: { zod: '^3.25.76' },
      });
      await harness.writeInstalledPackage({
        testbed,
        relativeDir: 'packages/@gateway/npm/node_modules/zod',
        version: '3.25.76',
      });

      const result = await duplicateInstallCheckBroker({
        rootPath: FilePathStub({ value: testbed.guildPath }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual([]);
    });
  });

  describe('gateway-nested plus app-nested', () => {
    it('VALID: {same name installed under the gateway package and under an app package} => fails naming both versions', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'duplicate-install-gateway-and-app' }),
      });
      await harness.writeWorkspacesRoot({ testbed });
      await harness.writeGatewayPackage({
        testbed,
        folder: 'npm',
        dependencies: { '@mantine/core': '^8.0.0' },
      });
      await harness.writeWorkspacePackage({ testbed, relativePath: 'packages/web', name: 'web' });
      await harness.writeInstalledPackage({
        testbed,
        relativeDir: 'packages/@gateway/npm/node_modules/@mantine/core',
        version: '8.3.18',
      });
      await harness.writeInstalledPackage({
        testbed,
        relativeDir: 'packages/web/node_modules/@mantine/core',
        version: '8.3.14',
      });

      const result = await duplicateInstallCheckBroker({
        rootPath: FilePathStub({ value: testbed.guildPath }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual([
        {
          packageName: '@mantine/core',
          locations: [
            { location: 'packages/web/node_modules/@mantine/core', version: '8.3.14' },
            { location: 'packages/@gateway/npm/node_modules/@mantine/core', version: '8.3.18' },
          ],
        },
      ]);
    });
  });

  describe('root plus gateway-nested', () => {
    it('VALID: {same name installed at the repo root and under the gateway package} => fails naming both versions', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'duplicate-install-root-and-gateway' }),
      });
      await harness.writeWorkspacesRoot({ testbed });
      await harness.writeGatewayPackage({
        testbed,
        folder: 'bin',
        dependencies: { glob: '^10.3.10' },
      });
      await harness.writeInstalledPackage({
        testbed,
        relativeDir: 'node_modules/glob',
        version: '10.3.10',
      });
      await harness.writeInstalledPackage({
        testbed,
        relativeDir: 'packages/@gateway/bin/node_modules/glob',
        version: '10.4.5',
      });

      const result = await duplicateInstallCheckBroker({
        rootPath: FilePathStub({ value: testbed.guildPath }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual([
        {
          packageName: 'glob',
          locations: [
            { location: 'node_modules/glob', version: '10.3.10' },
            { location: 'packages/@gateway/bin/node_modules/glob', version: '10.4.5' },
          ],
        },
      ]);
    });
  });

  describe('workspace-package names skipped', () => {
    it('VALID: {a gateway dependency name that is itself a workspace package, installed at two locations} => reports nothing', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'duplicate-install-workspace-name-skipped' }),
      });
      await harness.writeWorkspacesRoot({ testbed });
      await harness.writeGatewayPackage({
        testbed,
        folder: 'bin',
        dependencies: { '@dungeonmaster/node': '*' },
      });
      await harness.writeGatewayPackage({ testbed, folder: 'node' });
      // Two real copies on disk of the workspace-named dependency — still skipped, because the name
      // matches a workspace package (`@dungeonmaster/node`, the gateway folder just written) rather
      // than because no second copy exists.
      await harness.writeInstalledPackage({
        testbed,
        relativeDir: 'node_modules/@dungeonmaster/node',
        version: '0.1.0',
      });
      await harness.writeInstalledPackage({
        testbed,
        relativeDir: 'packages/@gateway/bin/node_modules/@dungeonmaster/node',
        version: '0.1.0',
      });

      const result = await duplicateInstallCheckBroker({
        rootPath: FilePathStub({ value: testbed.guildPath }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual([]);
    });
  });

  describe('no gateway folder', () => {
    it('VALID: {a workspaces repo with no packages/@gateway folder} => reports nothing', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'duplicate-install-no-gateway' }),
      });
      await harness.writeWorkspacesRoot({ testbed });
      await harness.writeWorkspacePackage({ testbed, relativePath: 'packages/web', name: 'web' });
      await harness.writeInstalledPackage({
        testbed,
        relativeDir: 'packages/web/node_modules/react',
        version: '19.0.0',
      });

      const result = await duplicateInstallCheckBroker({
        rootPath: FilePathStub({ value: testbed.guildPath }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual([]);
    });
  });
});
