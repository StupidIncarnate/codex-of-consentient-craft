import { installTestbedCreateBroker, BaseNameStub, RelativePathStub } from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { StartInstall } from './start-install';

describe('StartInstall', () => {
  describe('wiring to install flow', () => {
    it('VALID: {context} => delegates to flow and returns install result with config created', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'startup-wiring' }),
      });

      const result = StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const configContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'eslint.config.js' }),
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
