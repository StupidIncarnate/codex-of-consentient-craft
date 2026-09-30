import { installTestbedCreateBroker } from '@dungeonmaster/testing';
import { InstallFlow } from './install-flow';
import { InstallContextStub } from '@dungeonmaster/shared/contracts/install-context/install-context.stub';

describe('InstallFlow', () => {
  describe('delegation to responder', () => {
    it('VALID: {context: no existing config} => delegates to responder and creates eslint.config.js', () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'flow-create-eslint-config',
      });

      const result = InstallFlow({
        context: InstallContextStub({
          value: {
            targetProjectRoot: testbed.guildPath,
            dungeonmasterRoot: testbed.dungeonmasterPath,
          },
        }),
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
      expect(configContent).toMatch(
        /^const tsparser = require\('@typescript-eslint\/parser'\);$/mu,
      );
    });
  });
});
