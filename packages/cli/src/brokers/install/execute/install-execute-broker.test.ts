/**
 * PURPOSE: Tests for install execute broker
 */

import { installExecuteBroker } from './install-execute-broker';
import { installExecuteBrokerProxy } from './install-execute-broker.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
import { PackageNameStub } from '@dungeonmaster/shared/contracts/package-name/package-name.stub';
import { InstallContextStub } from '@dungeonmaster/shared/contracts/install-context/install-context.stub';
import { InstallResultStub } from '@dungeonmaster/shared/contracts/install-result/install-result.stub';

describe('installExecuteBroker', () => {
  describe('executing install', () => {
    it('VALID: {packageName, installPath, context} => returns success result when StartInstall succeeds', async () => {
      const proxy = installExecuteBrokerProxy();
      const packageName = PackageNameStub({ value: '@dungeonmaster/cli' });
      const installPath = FilePathStub({ value: '/path/to/start-install.ts' });
      const context = InstallContextStub({
        value: {
          targetProjectRoot: '/project',
          dungeonmasterRoot: '/dm',
        },
      });

      const mockResult = InstallResultStub({
        value: {
          packageName: '@dungeonmaster/cli',
          success: true,
          action: 'created',
        },
      });

      const mockStartInstall = jest.fn().mockResolvedValue(mockResult);
      const mockModule: Record<PropertyKey, unknown> = Object.create(null);
      mockModule.StartInstall = mockStartInstall;

      proxy.setupImport({ installPath, module: mockModule });

      const result = await installExecuteBroker({ packageName, installPath, context });

      expect(result).toStrictEqual(
        InstallResultStub({
          value: {
            packageName: '@dungeonmaster/cli',
            success: true,
            action: 'created',
          },
        }),
      );
    });

    it('ERROR: {packageName, installPath, context} => returns failed result when runtime has no StartInstall', async () => {
      const proxy = installExecuteBrokerProxy();
      const packageName = PackageNameStub({ value: '@dungeonmaster/test' });
      const installPath = FilePathStub({ value: '/path/to/invalid.ts' });
      const context = InstallContextStub({
        value: {
          targetProjectRoot: '/project',
          dungeonmasterRoot: '/dm',
        },
      });

      proxy.setupImport({ installPath, module: undefined });

      const result = await installExecuteBroker({ packageName, installPath, context });

      expect(result).toStrictEqual(
        InstallResultStub({
          value: {
            packageName: '@dungeonmaster/test',
            success: false,
            action: 'failed',
            error: 'No StartInstall function found in /path/to/invalid.ts',
          },
        }),
      );
    });

    it('ERROR: {packageName, installPath, context} => returns failed result when runtime import fails', async () => {
      const proxy = installExecuteBrokerProxy();
      const packageName = PackageNameStub({ value: '@dungeonmaster/test' });
      const installPath = FilePathStub({ value: '/path/to/missing.ts' });
      const context = InstallContextStub({
        value: {
          targetProjectRoot: '/project',
          dungeonmasterRoot: '/dm',
        },
      });

      proxy.setupImportFailure({ installPath, error: new Error('Module not found') });

      const result = await installExecuteBroker({ packageName, installPath, context });

      expect(result).toStrictEqual(
        InstallResultStub({
          value: {
            packageName: '@dungeonmaster/test',
            success: false,
            action: 'failed',
            error: 'Module not found',
          },
        }),
      );
    });

    it('ERROR: {packageName, installPath, context} => returns failed result when StartInstall throws', async () => {
      const proxy = installExecuteBrokerProxy();
      const packageName = PackageNameStub({ value: '@dungeonmaster/test' });
      const installPath = FilePathStub({ value: '/path/to/start-install.ts' });
      const context = InstallContextStub({
        value: {
          targetProjectRoot: '/project',
          dungeonmasterRoot: '/dm',
        },
      });

      const mockStartInstall = jest.fn().mockRejectedValue(new Error('Install failed'));
      const mockModule: Record<PropertyKey, unknown> = Object.create(null);
      mockModule.StartInstall = mockStartInstall;

      proxy.setupImport({ installPath, module: mockModule });

      const result = await installExecuteBroker({ packageName, installPath, context });

      expect(result).toStrictEqual(
        InstallResultStub({
          value: {
            packageName: '@dungeonmaster/test',
            success: false,
            action: 'failed',
            error: 'Install failed',
          },
        }),
      );
    });
  });

  describe('exportName: "StartInstallFinalize"', () => {
    it('VALID: {module exports StartInstallFinalize} => calls that export, not StartInstall', async () => {
      const proxy = installExecuteBrokerProxy();
      const packageName = PackageNameStub({ value: '@dungeonmaster/siegelense' });
      const installPath = FilePathStub({
        value: '/path/to/siegelense/start-install-finalize.ts',
      });
      const context = InstallContextStub({
        value: {
          targetProjectRoot: '/project',
          dungeonmasterRoot: '/dm',
        },
      });

      const mockResult = InstallResultStub({
        value: {
          packageName: '@dungeonmaster/siegelense',
          success: true,
          action: 'created',
          message:
            'npm run build --workspace=hydration-recipes finished for packages/hydration-recipes/',
        },
      });

      const mockStartInstallFinalize = jest.fn().mockResolvedValue(mockResult);
      const mockModule: Record<PropertyKey, unknown> = Object.create(null);
      mockModule.StartInstallFinalize = mockStartInstallFinalize;

      proxy.setupImport({ installPath, module: mockModule });

      const result = await installExecuteBroker({
        packageName,
        installPath,
        context,
        exportName: 'StartInstallFinalize',
      });

      expect(result).toStrictEqual(
        InstallResultStub({
          value: {
            packageName: '@dungeonmaster/siegelense',
            success: true,
            action: 'created',
            message:
              'npm run build --workspace=hydration-recipes finished for packages/hydration-recipes/',
          },
        }),
      );
    });

    it('ERROR: {module exports only StartInstall} => returns failed result naming StartInstallFinalize', async () => {
      const proxy = installExecuteBrokerProxy();
      const packageName = PackageNameStub({ value: '@dungeonmaster/cli' });
      const installPath = FilePathStub({ value: '/path/to/cli/start-install-finalize.ts' });
      const context = InstallContextStub({
        value: {
          targetProjectRoot: '/project',
          dungeonmasterRoot: '/dm',
        },
      });

      const mockStartInstall = jest.fn();
      const mockModule: Record<PropertyKey, unknown> = Object.create(null);
      mockModule.StartInstall = mockStartInstall;

      proxy.setupImport({ installPath, module: mockModule });

      const result = await installExecuteBroker({
        packageName,
        installPath,
        context,
        exportName: 'StartInstallFinalize',
      });

      expect(result).toStrictEqual(
        InstallResultStub({
          value: {
            packageName: '@dungeonmaster/cli',
            success: false,
            action: 'failed',
            error: `No StartInstallFinalize function found in ${installPath}`,
          },
        }),
      );
    });
  });
});
