/**
 * PURPOSE: Tests for install orchestrate broker
 */

import { installOrchestrateBroker } from './install-orchestrate-broker';
import { installOrchestrateBrokerProxy } from './install-orchestrate-broker.proxy';
import {
  FilePathStub,
  PackageNameStub,
  InstallContextStub,
  InstallResultStub,
} from '@dungeonmaster/shared/contracts';

describe('installOrchestrateBroker', () => {
  describe('orchestrating installs', () => {
    it('VALID: {packages, context} => returns results for all packages', async () => {
      const { installExecuteProxy } = installOrchestrateBrokerProxy();
      const context = InstallContextStub({
        value: {
          targetProjectRoot: '/project',
          dungeonmasterRoot: '/dm',
        },
      });

      const pkg1 = Object.assign(Object.create(null), {
        packageName: PackageNameStub({ value: '@dungeonmaster/cli' }),
        installPath: FilePathStub({ value: '/path/to/cli/start-install.ts' }),
      });
      const pkg2 = Object.assign(Object.create(null), {
        packageName: PackageNameStub({ value: '@dungeonmaster/hooks' }),
        installPath: FilePathStub({ value: '/path/to/hooks/start-install.ts' }),
      });
      const packages = [pkg1, pkg2];

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

      installExecuteProxy.setupImport({ module });

      const results = await installOrchestrateBroker({ packages, context });

      expect(results).toHaveLength(2);
      expect(results[0]?.success).toBe(true);
      expect(results[1]?.success).toBe(true);
    });

    it('VALID: {packages: [], context} => returns empty array for no packages', async () => {
      installOrchestrateBrokerProxy();
      const context = InstallContextStub({
        value: {
          targetProjectRoot: '/project',
          dungeonmasterRoot: '/dm',
        },
      });
      const emptyPackages: never[] = [];

      const results = await installOrchestrateBroker({ packages: emptyPackages, context });

      expect(results).toStrictEqual([]);
    });

    it('ERROR: {packages, context} => continues on failure and returns all results', async () => {
      const { installExecuteProxy } = installOrchestrateBrokerProxy();
      const context = InstallContextStub({
        value: {
          targetProjectRoot: '/project',
          dungeonmasterRoot: '/dm',
        },
      });

      const pkg1 = Object.assign(Object.create(null), {
        packageName: PackageNameStub({ value: '@dungeonmaster/cli' }),
        installPath: FilePathStub({ value: '/path/to/cli/start-install.ts' }),
      });
      const pkg2 = Object.assign(Object.create(null), {
        packageName: PackageNameStub({ value: '@dungeonmaster/hooks' }),
        installPath: FilePathStub({ value: '/path/to/hooks/start-install.ts' }),
      });
      const packages = [pkg1, pkg2];

      const successResult = InstallResultStub({
        value: {
          packageName: '@dungeonmaster/cli',
          success: true,
          action: 'created',
        },
      });

      // First call succeeds, second call throws to simulate failure
      const mockFn = jest
        .fn()
        .mockResolvedValueOnce(successResult)
        .mockRejectedValueOnce(new Error('Install failed'));
      const module: Record<PropertyKey, unknown> = Object.create(null);
      module.StartInstall = mockFn;

      installExecuteProxy.setupImport({ module });

      const results = await installOrchestrateBroker({ packages, context });

      expect(results).toHaveLength(2);

      // Results are returned in order but one succeeds and one fails
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      expect(successCount).toBe(1);
      expect(failureCount).toBe(1);
    });
  });
});
