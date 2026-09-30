import { installTestbedCreateBroker } from '@dungeonmaster/testing';
import { StartInstall } from './start-install';
import { InstallContextStub } from '@dungeonmaster/shared/contracts/install-context/install-context.stub';

describe('StartInstall', () => {
  describe('wiring to install flow', () => {
    it('VALID: {context} => delegates to flow and returns install result with config created', () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'startup-wiring',
      });

      const result = StartInstall({
        context: InstallContextStub({ value: {
          targetProjectRoot: testbed.guildPath,
          dungeonmasterRoot: testbed.dungeonmasterPath,
        } }),
      });

      const configContent = testbed.readFile({
        relativePath: 'eslint.config.js',
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/eslint-plugin',
        success: true,
        action: 'created',
        message: 'Created eslint.config.js',
      });
      expect(configContent).toMatch(
        /^const dungeonmaster = require\('@dungeonmaster\/eslint-plugin'\)\.default;$/mu,
      );
    });
  });
});
