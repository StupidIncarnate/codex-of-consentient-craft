import { installTestbedCreateBroker, BaseNameStub, RelativePathStub } from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { InstallFlow } from './install-flow';

describe('InstallFlow', () => {
  describe('delegation to responders', () => {
    it('VALID: {fresh target} => creates the link, the gitignore entry, and the empty recipes package', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'siegelense-flow-fresh' }),
      });

      // The siegelense root is resolved through DUNGEONMASTER_HOME — the same env var
      // locationsRootPathFindBroker reads at runtime — never through context.dungeonmasterRoot,
      // which names the CLI package's own install location. The two point at DIFFERENT
      // testbed-nested directories, so a responder that read the wrong one produces a visibly
      // wrong link target instead of silently agreeing by accident.
      const dungeonmasterHomePath = `${testbed.guildPath}/.dm-home`;
      process.env.DUNGEONMASTER_HOME = dungeonmasterHomePath;

      const result = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: `${testbed.guildPath}/.wrong-cli-root` }),
        },
      });

      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

      const gitignoreContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.gitignore' }),
      });
      const recipesEntries = testbed.listDir({
        relativePath: RelativePathStub({ value: 'packages/hydration-recipes/src' }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'created',
        message: `Created .siegelense -> ${dungeonmasterHomePath}/siegelense; Created .gitignore with .siegelense; Created packages/hydration-recipes/src/`,
      });
      expect(gitignoreContent).toBe('.siegelense\n');
      expect(recipesEntries).toStrictEqual([]);
    });

    it('VALID: {flow run twice} => every responder reports skipped and the overall result still reads as a success', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'siegelense-flow-twice' }),
      });

      const dungeonmasterHomePath = `${testbed.guildPath}/.dm-home`;
      process.env.DUNGEONMASTER_HOME = dungeonmasterHomePath;

      await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: `${testbed.guildPath}/.wrong-cli-root` }),
        },
      });

      const secondResult = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: `${testbed.guildPath}/.wrong-cli-root` }),
        },
      });

      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

      const gitignoreContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.gitignore' }),
      });
      const recipesEntries = testbed.listDir({
        relativePath: RelativePathStub({ value: 'packages/hydration-recipes/src' }),
      });

      testbed.cleanup();

      expect(secondResult).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message: `.siegelense already points at ${dungeonmasterHomePath}/siegelense; .siegelense already in .gitignore; packages/hydration-recipes/ already present; left untouched`,
      });
      expect(gitignoreContent).toBe('.siegelense\n');
      expect(recipesEntries).toStrictEqual([]);
    });
  });
});
