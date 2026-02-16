import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { StartInstall } from './start-install';

describe('start-install integration', () => {
  describe('StartInstall', () => {
    it('VALID: {context: no existing .gitignore} => creates .gitignore with .ward/', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'ward-install-create' }),
      });

      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/ward',
        success: true,
        action: 'created',
        message: 'Created .gitignore with .ward/',
      });

      const gitignoreContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.gitignore' }),
      });

      testbed.cleanup();

      expect(gitignoreContent).toMatch(/^\.ward\/\n$/u);
    });

    it('VALID: {context: existing .gitignore without .ward/} => appends .ward/ to .gitignore', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'ward-install-append' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.gitignore' }),
        content: FileContentStub({ value: 'node_modules/\ndist/\n' }),
      });

      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/ward',
        success: true,
        action: 'merged',
        message: 'Added .ward/ to existing .gitignore',
      });

      const gitignoreContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.gitignore' }),
      });

      testbed.cleanup();

      expect(gitignoreContent).toMatch(/node_modules\//u);
      expect(gitignoreContent).toMatch(/\.ward\//u);
    });

    it('VALID: {context: .gitignore already has .ward/} => skips installation', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'ward-install-skip' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.gitignore' }),
        content: FileContentStub({ value: 'node_modules/\n.ward/\n' }),
      });

      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/ward',
        success: true,
        action: 'skipped',
        message: '.ward/ already in .gitignore',
      });
    });
  });
});
