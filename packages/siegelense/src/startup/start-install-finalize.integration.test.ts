import { installTestbedCreateBroker } from '@dungeonmaster/testing';

import { StartInstallFinalize } from './start-install-finalize';
import { InstallContextStub } from '@dungeonmaster/shared/contracts/install-context/install-context.stub';

describe('StartInstallFinalize', () => {
  describe('wiring to install finalize flow', () => {
    it('VALID: {nothing scaffolded this process} => delegates to the flow and returns its skipped result', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'start-install-finalize-wiring',
      });

      const result = await StartInstallFinalize({
        context: InstallContextStub({ value: {
          targetProjectRoot: testbed.guildPath,
          dungeonmasterRoot: `${testbed.guildPath}/.wrong-cli-root`,
        } }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message: 'no freshly scaffolded packages/hydration-recipes/ this run',
      });
    });
  });
});
