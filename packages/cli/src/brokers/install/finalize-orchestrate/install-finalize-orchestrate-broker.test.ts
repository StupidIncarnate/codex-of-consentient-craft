/**
 * PURPOSE: Tests for install finalize orchestrate broker
 */

import { installFinalizeOrchestrateBroker } from './install-finalize-orchestrate-broker';
import { installFinalizeOrchestrateBrokerProxy } from './install-finalize-orchestrate-broker.proxy';
import { PackageNameStub } from '@dungeonmaster/shared/contracts/package-name/package-name.stub';
import { InstallContextStub } from '@dungeonmaster/shared/contracts/install-context/install-context.stub';

describe('installFinalizeOrchestrateBroker', () => {
  describe('orchestrating finalize calls', () => {
    it('VALID: {packages: [], context} => returns empty array for no packages', async () => {
      installFinalizeOrchestrateBrokerProxy();
      const context = InstallContextStub({
        value: {
          targetProjectRoot: '/project',
          dungeonmasterRoot: '/dm',
        },
      });
      const emptyPackages: never[] = [];

      const results = await installFinalizeOrchestrateBroker({ packages: emptyPackages, context });

      expect(results).toStrictEqual([]);
    });

    it('VALID: {packages: none carry a finalizeInstallPath} => returns empty array, skipping every package without an import attempt', async () => {
      installFinalizeOrchestrateBrokerProxy();
      const context = InstallContextStub({
        value: {
          targetProjectRoot: '/project',
          dungeonmasterRoot: '/dm',
        },
      });

      const pkg1 = Object.assign(Object.create(null), {
        packageName: PackageNameStub({ value: '@dungeonmaster/cli' }),
        installPath: '/path/to/cli/start-install.ts',
        finalizeInstallPath: null,
      });
      const pkg2 = Object.assign(Object.create(null), {
        packageName: PackageNameStub({ value: '@dungeonmaster/hooks' }),
        installPath: '/path/to/hooks/start-install.ts',
        finalizeInstallPath: null,
      });
      const packages = [pkg1, pkg2];

      const results = await installFinalizeOrchestrateBroker({ packages, context });

      expect(results).toStrictEqual([]);
    });

    it('VALID: {one package carries a finalizeInstallPath, one does not} => returns only the one result', async () => {
      const proxy = installFinalizeOrchestrateBrokerProxy();
      const context = InstallContextStub({
        value: {
          targetProjectRoot: '/project',
          dungeonmasterRoot: '/dm',
        },
      });

      const withoutFinalize = Object.assign(Object.create(null), {
        packageName: PackageNameStub({ value: '@dungeonmaster/cli' }),
        installPath: '/path/to/cli/start-install.ts',
        finalizeInstallPath: null,
      });
      const finalizeInstallPath = '/path/to/siegelense/start-install-finalize.ts';
      const withFinalize = Object.assign(Object.create(null), {
        packageName: PackageNameStub({ value: '@dungeonmaster/siegelense' }),
        installPath: '/path/to/siegelense/start-install.ts',
        finalizeInstallPath,
      });
      const packages = [withoutFinalize, withFinalize];

      const mockStartInstallFinalize = jest.fn().mockResolvedValue({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'created',
        message:
          'npm run build --workspace=hydration-recipes finished for packages/hydration-recipes/',
      });
      const moduleWithFinalize: Record<PropertyKey, unknown> = Object.create(null);
      moduleWithFinalize.StartInstallFinalize = mockStartInstallFinalize;

      proxy.setupImport({ finalizeInstallPath, module: moduleWithFinalize });

      const results = await installFinalizeOrchestrateBroker({ packages, context });

      expect(results).toStrictEqual([
        {
          packageName: '@dungeonmaster/siegelense',
          success: true,
          action: 'created',
          message:
            'npm run build --workspace=hydration-recipes finished for packages/hydration-recipes/',
        },
      ]);
    });
  });
});
