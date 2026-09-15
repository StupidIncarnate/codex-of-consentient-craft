import { installTestbedCreateBroker, BaseNameStub, RelativePathStub } from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { InstallFlow } from './install-flow';

describe('InstallFlow', () => {
  describe('delegation to responders', () => {
    it('VALID: {fresh target} => creates the link, the gitignore entry, and the empty recipes package', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'siegelense-flow-fresh' }),
      });

      // dungeonmasterRoot mirrors targetProjectRoot rather than testbed.dungeonmasterPath here,
      // unlike every other package's install-flow test: InstallLinkCreateResponder is the first
      // responder in this repo that actually WRITES under dungeonmasterRoot (mkdir + symlink), so
      // testbed.dungeonmasterPath — the real checked-out worktree root — would land a real
      // siegelense/ directory in the live repo tree. Pointing both context fields at the same
      // isolated testbed directory keeps every write inside the OS tmp dir.
      const result = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.guildPath }),
        },
      });

      const gitignoreContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.gitignore' }),
      });
      const recipesEntries = testbed.listDir({
        relativePath: RelativePathStub({ value: 'packages/siegelense-recipes/src' }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'created',
        message: `Created .siegelense -> ${testbed.guildPath}/siegelense; Created .gitignore with .siegelense/; Created packages/siegelense-recipes/src/`,
      });
      expect(gitignoreContent).toBe('.siegelense/\n');
      expect(recipesEntries).toStrictEqual([]);
    });

    it('VALID: {flow run twice} => every responder reports skipped and the overall result still reads as a success', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'siegelense-flow-twice' }),
      });

      await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.guildPath }),
        },
      });

      const secondResult = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.guildPath }),
        },
      });

      const gitignoreContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.gitignore' }),
      });
      const recipesEntries = testbed.listDir({
        relativePath: RelativePathStub({ value: 'packages/siegelense-recipes/src' }),
      });

      testbed.cleanup();

      expect(secondResult).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message: `.siegelense already points at ${testbed.guildPath}/siegelense; .siegelense/ already in .gitignore; packages/siegelense-recipes/ already present; left untouched`,
      });
      expect(gitignoreContent).toBe('.siegelense/\n');
      expect(recipesEntries).toStrictEqual([]);
    });
  });
});
