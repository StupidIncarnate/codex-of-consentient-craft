/**
 * PURPOSE: Tests for install run broker
 */

import { installRunBroker } from './install-run-broker';
import { installRunBrokerProxy } from './install-run-broker.proxy';
import { InstallContextStub, InstallResultStub } from '@dungeonmaster/shared/contracts';

import { FileNameStub } from '../../../contracts/file-name/file-name.stub';

describe('installRunBroker', () => {
  describe('running installation', () => {
    it('VALID: {context with packages} => discovers and installs packages', async () => {
      const { packageDiscoverProxy, installOrchestratProxy } = installRunBrokerProxy();
      const context = InstallContextStub({
        value: {
          targetProjectRoot: '/project',
          dungeonmasterRoot: '/dm',
        },
      });

      // Setup package discover to return packages
      packageDiscoverProxy.fsReaddirProxy.returns({
        files: [FileNameStub({ value: 'cli' }), FileNameStub({ value: 'hooks' })],
      });
      // Return true for both cli and hooks standard path checks
      packageDiscoverProxy.fsExistsSyncProxy.returns({ result: true });
      packageDiscoverProxy.fsExistsSyncProxy.returns({ result: true });

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

      installOrchestratProxy.installExecuteProxy.setupImport({ module });

      const results = await installRunBroker({ context });

      expect(results).toHaveLength(2);
      expect(results[0]?.success).toBe(true);
    });

    it('VALID: {context with no packages} => returns empty array', async () => {
      const { packageDiscoverProxy } = installRunBrokerProxy();
      const context = InstallContextStub({
        value: {
          targetProjectRoot: '/project',
          dungeonmasterRoot: '/dm',
        },
      });

      // Setup package discover to return no packages
      packageDiscoverProxy.fsReaddirProxy.returns({
        files: [],
      });

      const results = await installRunBroker({ context });

      expect(results).toStrictEqual([]);
    });
  });
});
