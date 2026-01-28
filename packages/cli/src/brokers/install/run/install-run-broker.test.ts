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

import { FileNameStub } from '../../../contracts/file-name/file-name.stub';

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

      proxy.setupImport({ module });

      const results = await installRunBroker({ context });

      expect(results).toHaveLength(2);
      expect(results[0]?.success).toBe(true);
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
});
