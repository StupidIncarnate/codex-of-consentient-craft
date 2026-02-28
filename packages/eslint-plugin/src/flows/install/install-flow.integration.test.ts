import { installTestbedCreateBroker, BaseNameStub, RelativePathStub } from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { InstallFlow } from './install-flow';

describe('InstallFlow', () => {
  describe('delegation to responder', () => {
    it('VALID: {context: no existing config} => delegates to responder and creates eslint.config.js', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'flow-create-eslint-config' }),
      });

      const result = InstallFlow({
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
      expect(configContent).toMatch(/@dungeonmaster\/eslint-plugin/u);
      expect(configContent).toMatch(/@typescript-eslint\/parser/u);
    });
  });
});
