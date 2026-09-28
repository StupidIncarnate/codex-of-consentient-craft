/**
 * PURPOSE: Tests for install run broker
 */

import { installRunBroker } from './install-run-broker';
import { installRunBrokerProxy } from './install-run-broker.proxy';
import {
  InstallContextStub,
  InstallResultStub,
  FilePathStub,
} from '@dungeonmaster/shared/contracts';

import { FileNameStub } from '@dungeonmaster/shared/contracts';

describe('installRunBroker', () => {
  describe('running installation', () => {
    it('VALID: {context with packages} => discovers and installs packages', async () => {
      const proxy = installRunBrokerProxy();
      const context = InstallContextStub({
        value: {
          targetProjectRoot: '/project',
          dungeonmasterRoot: '/dm',
        },
      });

      // Setup package discover to return packages
      proxy.setupPackageDiscovery({
        packagesPath: FilePathStub({ value: '/dm/packages' }),
        packages: [
          {
            name: FileNameStub({ value: 'cli' }),
            standardPath: FilePathStub({ value: '/dm/packages/cli/dist/startup/start-install.js' }),
            installerLocation: 'standard',
          },
          {
            name: FileNameStub({ value: 'hooks' }),
            standardPath: FilePathStub({
              value: '/dm/packages/hooks/dist/startup/start-install.js',
            }),
            installerLocation: 'standard',
          },
        ],
      });

      // Setup install execute to return success
      const successResult = InstallResultStub({
        value: {
          packageName: '@dungeonmaster/cli',
          success: true,
          action: 'created',
        },
      });

      const mockFn = jest.fn().mockResolvedValue(successResult);
      const module: Record<PropertyKey, unknown> = Object.create(null);
      module.StartInstall = mockFn;

      proxy.setupImport({
        installPath: FilePathStub({ value: '/dm/packages/cli/dist/startup/start-install.js' }),
        module,
      });
      proxy.setupImport({
        installPath: FilePathStub({ value: '/dm/packages/hooks/dist/startup/start-install.js' }),
        module,
      });

      const results = await installRunBroker({ context });

      expect(results).toStrictEqual([
        InstallResultStub({
          value: {
            packageName: '@dungeonmaster/cli',
            success: true,
            action: 'created',
          },
        }),
        InstallResultStub({
          value: {
            packageName: '@dungeonmaster/cli',
            success: true,
            action: 'created',
          },
        }),
      ]);
    });

    it('VALID: {context with no packages} => returns empty array', async () => {
      const proxy = installRunBrokerProxy();
      const context = InstallContextStub({
        value: {
          targetProjectRoot: '/project',
          dungeonmasterRoot: '/dm',
        },
      });

      // Setup package discover to return no packages
      proxy.setupEmptyPackagesDirectory({
        packagesPath: FilePathStub({ value: '/dm/packages' }),
      });

      const results = await installRunBroker({ context });

      expect(results).toStrictEqual([]);
    });
  });

  describe('the after-all-installs pass (DEF-99)', () => {
    it("VALID: {a package with a finalize step is discovered BEFORE a later package} => its finalize still runs only after every package's StartInstall, including the later one", async () => {
      const proxy = installRunBrokerProxy();
      const context = InstallContextStub({
        value: {
          targetProjectRoot: '/project',
          dungeonmasterRoot: '/dm',
        },
      });

      const siegelenseInstallPath = FilePathStub({
        value: '/dm/packages/siegelense/dist/startup/start-install.js',
      });
      const siegelenseFinalizeInstallPath = FilePathStub({
        value: '/dm/packages/siegelense/dist/startup/start-install-finalize.js',
      });
      const laterInstallPath = FilePathStub({
        value: '/dm/packages/writes-devdeps/dist/startup/start-install.js',
      });

      // siegelense is discovered FIRST — the exact shape of the readdirSync ordering that used to
      // let its inline npm install run before this LATER package's own StartInstall had written
      // its part of the shared root package.json.
      proxy.setupPackageDiscovery({
        packagesPath: FilePathStub({ value: '/dm/packages' }),
        packages: [
          {
            name: FileNameStub({ value: 'siegelense' }),
            standardPath: siegelenseInstallPath,
            installerLocation: 'standard',
            finalizeInstallPath: siegelenseFinalizeInstallPath,
          },
          {
            name: FileNameStub({ value: 'writes-devdeps' }),
            standardPath: laterInstallPath,
            installerLocation: 'standard',
          },
        ],
      });

      const events: unknown[] = [];

      const siegelenseModule: Record<PropertyKey, unknown> = Object.create(null);
      siegelenseModule.StartInstall = async (): Promise<ReturnType<typeof InstallResultStub>> => {
        events.push('siegelense:StartInstall');
        return Promise.resolve(
          InstallResultStub({
            value: { packageName: '@dungeonmaster/siegelense', success: true, action: 'created' },
          }),
        );
      };

      const siegelenseFinalizeModule: Record<PropertyKey, unknown> = Object.create(null);
      siegelenseFinalizeModule.StartInstallFinalize = async (): Promise<
        ReturnType<typeof InstallResultStub>
      > => {
        events.push('siegelense:StartInstallFinalize');
        return Promise.resolve(
          InstallResultStub({
            value: { packageName: '@dungeonmaster/siegelense', success: true, action: 'created' },
          }),
        );
      };

      const laterModule: Record<PropertyKey, unknown> = Object.create(null);
      laterModule.StartInstall = async (): Promise<ReturnType<typeof InstallResultStub>> => {
        events.push('writes-devdeps:StartInstall');
        return Promise.resolve(
          InstallResultStub({
            value: {
              packageName: '@dungeonmaster/writes-devdeps',
              success: true,
              action: 'created',
            },
          }),
        );
      };

      proxy.setupImport({ installPath: siegelenseInstallPath, module: siegelenseModule });
      proxy.setupFinalizeImport({
        finalizeInstallPath: siegelenseFinalizeInstallPath,
        module: siegelenseFinalizeModule,
      });
      proxy.setupImport({ installPath: laterInstallPath, module: laterModule });

      await installRunBroker({ context });

      expect(events).toStrictEqual([
        'siegelense:StartInstall',
        'writes-devdeps:StartInstall',
        'siegelense:StartInstallFinalize',
      ]);
    });
  });
});
