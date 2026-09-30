import { installTestbedCreateBroker } from '@dungeonmaster/testing';

import { StartInstall } from './start-install';
import { InstallContextStub } from '@dungeonmaster/shared/contracts/install-context/install-context.stub';

describe('start-install integration', () => {
  describe('StartInstall', () => {
    it('VALID: {context} => delegates to flow and returns combined install result', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'ward-startup-wiring',
      });

      testbed.writeFile({
        relativePath: 'package.json',
        content: JSON.stringify({ name: 'proj', version: '1.0.0' }, null, 2),
      });

      const result = await StartInstall({
        context: InstallContextStub({
          value: {
            targetProjectRoot: testbed.guildPath,
            dungeonmasterRoot: testbed.dungeonmasterPath,
          },
        }),
      });

      const gitignoreContent = testbed.readFile({
        relativePath: '.gitignore',
      });
      const packageJsonContent = testbed.readFile({
        relativePath: 'package.json',
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/ward',
        success: true,
        action: 'created',
        message:
          'Created .gitignore with .ward/, test-results/, .ward-playwright-report*.json; Added ward scripts to package.json',
      });
      expect(gitignoreContent).toBe('.ward/\ntest-results/\n.ward-playwright-report*.json\n');
      // String-exact: the real on-disk write ends in one trailing newline.
      expect(String(packageJsonContent).endsWith('\n')).toBe(true);
      expect(String(packageJsonContent).endsWith('\n\n')).toBe(false);
    });
  });
});
