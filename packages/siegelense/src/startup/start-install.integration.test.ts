import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { StartInstall } from './start-install';

describe('StartInstall', () => {
  describe('wiring to install flow', () => {
    it('VALID: {fresh target} => delegates to the flow and returns the install result', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'siegelense-start-install-wiring' }),
      });

      // dungeonmasterRoot mirrors targetProjectRoot here rather than testbed.dungeonmasterPath —
      // see install-flow.integration.test.ts for why: this package's link-create responder is the
      // first in the repo to WRITE under dungeonmasterRoot, and testbed.dungeonmasterPath is the
      // real checked-out worktree root.
      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.guildPath }),
        },
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'created',
        message: `Created .siegelense -> ${testbed.guildPath}/siegelense; Created .gitignore with .siegelense/; Created packages/siegelense-recipes/src/`,
      });
    });
  });

  describe('the .siegelense link', () => {
    it('VALID: {fresh target} => .siegelense exists and resolves to the real siegelense root, not just to something', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'siegelense-start-install-link-resolves' }),
      });

      await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.guildPath }),
        },
      });

      // A write THROUGH the link path, read back through the REAL (unlinked) path: a dangling
      // link throws on the write, and a link pointing at the wrong directory reads back null here
      // — either way this fails loudly, unlike an existence check on `.siegelense` alone.
      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.siegelense/probe.txt' }),
        content: FileContentStub({ value: 'siegelense-link-resolves-here\n' }),
      });
      const readThroughRealPath = testbed.readFile({
        relativePath: RelativePathStub({ value: 'siegelense/probe.txt' }),
      });

      testbed.cleanup();

      expect(readThroughRealPath).toBe('siegelense-link-resolves-here\n');
    });
  });

  describe('the .gitignore entry', () => {
    it('VALID: {install run twice} => the .siegelense line appears exactly once', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'siegelense-start-install-gitignore-twice' }),
      });

      await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.guildPath }),
        },
      });
      await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.guildPath }),
        },
      });

      const gitignoreContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.gitignore' }),
      });

      testbed.cleanup();

      const entryLines = String(gitignoreContent)
        .split('\n')
        .filter((line) => line === '.siegelense/');
      const entryCount = entryLines.length;

      expect(entryCount).toBe(1);
    });
  });

  describe('the recipes scaffold', () => {
    it('VALID: {fresh target} => packages/siegelense-recipes/src exists and is empty', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'siegelense-start-install-recipes-empty' }),
      });

      await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.guildPath }),
        },
      });

      const recipesEntries = testbed.listDir({
        relativePath: RelativePathStub({ value: 'packages/siegelense-recipes/src' }),
      });

      testbed.cleanup();

      expect(recipesEntries).toStrictEqual([]);
    });

    it('VALID: {recipes folder already holds a file, install run again} => the file is left untouched', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'siegelense-start-install-recipes-untouched' }),
      });

      await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.guildPath }),
        },
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'packages/siegelense-recipes/src/marker.txt' }),
        content: FileContentStub({ value: 'do not touch\n' }),
      });

      await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.guildPath }),
        },
      });

      const markerContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'packages/siegelense-recipes/src/marker.txt' }),
      });

      testbed.cleanup();

      expect(markerContent).toBe('do not touch\n');
    });
  });

  describe('path shape of the result', () => {
    it('VALID: {fresh target} => the resolved siegelense root embedded in the result message is an absolute path', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'siegelense-start-install-absolute-path' }),
      });

      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.guildPath }),
        },
      });

      testbed.cleanup();

      const afterArrow = String(String(result.message).split(' -> ')[1]);
      const resolvedTarget = String(afterArrow.split(';')[0]);

      expect(resolvedTarget).toBe(`${testbed.guildPath}/siegelense`);
      expect(resolvedTarget.startsWith('/')).toBe(true);
    });
  });
});
