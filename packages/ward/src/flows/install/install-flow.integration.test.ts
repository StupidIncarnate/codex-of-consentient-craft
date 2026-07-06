import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { InstallFlow } from './install-flow';
import { installScriptsStatics } from '../../statics/install-scripts/install-scripts-statics';

describe('InstallFlow', () => {
  describe('delegation to responders', () => {
    it('VALID: {no .gitignore, package.json present} => creates .gitignore and adds ward scripts', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'ward-flow-create' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
        content: FileContentStub({
          value: JSON.stringify({ name: 'proj', version: '1.0.0' }, null, 2),
        }),
      });

      const result = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const gitignoreContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.gitignore' }),
      });
      const packageJsonContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/ward',
        success: true,
        action: 'created',
        message: 'Created .gitignore with .ward/; Added ward scripts to package.json',
      });
      expect(gitignoreContent).toMatch(/^\.ward\/\n$/u);
      expect(packageJsonContent).toBe(
        JSON.stringify(
          { name: 'proj', version: '1.0.0', scripts: installScriptsStatics.scripts },
          null,
          2,
        ),
      );
    });

    it('VALID: {.gitignore has .ward/, all scripts present} => skips both', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'ward-flow-skip' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.gitignore' }),
        content: FileContentStub({ value: 'node_modules/\n.ward/\n' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
        content: FileContentStub({
          value: JSON.stringify({ name: 'proj', scripts: installScriptsStatics.scripts }, null, 2),
        }),
      });

      const result = await InstallFlow({
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
        message: '.ward/ already in .gitignore; All ward scripts already present',
      });
    });
  });
});
