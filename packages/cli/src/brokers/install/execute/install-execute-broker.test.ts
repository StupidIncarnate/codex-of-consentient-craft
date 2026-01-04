/**
 * PURPOSE: Tests for install execute broker
 */

import { installExecuteBroker } from './install-execute-broker';
import { installExecuteBrokerProxy } from './install-execute-broker.proxy';
import {
  FilePathStub,
  PackageNameStub,
  InstallContextStub,
  InstallResultStub,
} from '@dungeonmaster/shared/contracts';

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

      proxy.setupImport({ module: mockModule });

      const result = await installExecuteBroker({ packageName, installPath, context });

      expect(result.success).toBe(true);
      expect(result.action).toBe('created');
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

      proxy.setupImport({ module: undefined });

      const result = await installExecuteBroker({ packageName, installPath, context });

      expect(result.success).toBe(false);
      expect(result.action).toBe('failed');
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

      proxy.setupImport({ module: new Error('Module not found') });

      const result = await installExecuteBroker({ packageName, installPath, context });

      expect(result.success).toBe(false);
      expect(result.action).toBe('failed');
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

      proxy.setupImport({ module: mockModule });

      const result = await installExecuteBroker({ packageName, installPath, context });

      expect(result.success).toBe(false);
      expect(result.action).toBe('failed');
    });
  });
});
