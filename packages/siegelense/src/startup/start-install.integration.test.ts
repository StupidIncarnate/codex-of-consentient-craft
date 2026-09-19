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

      // The siegelense root is resolved through DUNGEONMASTER_HOME — the same env var
      // locationsRootPathFindBroker reads at runtime — never through context.dungeonmasterRoot,
      // which names the CLI package's own install location. The two point at DIFFERENT
      // testbed-nested directories, so a responder that read the wrong one produces a visibly
      // wrong link target instead of silently agreeing by accident.
      const dungeonmasterHomePath = `${testbed.guildPath}/.dm-home`;
      process.env.DUNGEONMASTER_HOME = dungeonmasterHomePath;

      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: `${testbed.guildPath}/.wrong-cli-root` }),
        },
      });

      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'created',
        message: `Created .siegelense -> ${dungeonmasterHomePath}/siegelense; Created .gitignore with .siegelense; Created packages/hydration-recipes/src/`,
      });
    });
  });

  describe('the .siegelense link', () => {
    it('VALID: {fresh target} => .siegelense exists and resolves to the real siegelense root, not just to something', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'siegelense-start-install-link-resolves' }),
      });

      const dungeonmasterHomePath = `${testbed.guildPath}/.dm-home`;
      process.env.DUNGEONMASTER_HOME = dungeonmasterHomePath;

      await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: `${testbed.guildPath}/.wrong-cli-root` }),
        },
      });

      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

      // A write THROUGH the link path, read back through the REAL path under the dungeonmaster
      // home: a dangling link throws on the write, and a link pointing at the wrong directory
      // reads back null here — either way this fails loudly, unlike an existence check on
      // `.siegelense` alone.
      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.siegelense/probe.txt' }),
        content: FileContentStub({ value: 'siegelense-link-resolves-here\n' }),
      });
      const readThroughRealPath = testbed.readFile({
        relativePath: RelativePathStub({ value: '.dm-home/siegelense/probe.txt' }),
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

      const dungeonmasterHomePath = `${testbed.guildPath}/.dm-home`;
      process.env.DUNGEONMASTER_HOME = dungeonmasterHomePath;

      await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: `${testbed.guildPath}/.wrong-cli-root` }),
        },
      });
      await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: `${testbed.guildPath}/.wrong-cli-root` }),
        },
      });

      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

      const gitignoreContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.gitignore' }),
      });

      testbed.cleanup();

      const entryLines = String(gitignoreContent)
        .split('\n')
        .filter((line) => line === '.siegelense');
      const entryCount = entryLines.length;

      expect(entryCount).toBe(1);
    });
  });

  describe('the recipes scaffold', () => {
    it('VALID: {fresh target} => packages/hydration-recipes/src exists and is empty', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'siegelense-start-install-recipes-empty' }),
      });

      const dungeonmasterHomePath = `${testbed.guildPath}/.dm-home`;
      process.env.DUNGEONMASTER_HOME = dungeonmasterHomePath;

      await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: `${testbed.guildPath}/.wrong-cli-root` }),
        },
      });

      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

      const recipesEntries = testbed.listDir({
        relativePath: RelativePathStub({ value: 'packages/hydration-recipes/src' }),
      });

      testbed.cleanup();

      expect(recipesEntries).toStrictEqual([]);
    });

    it('VALID: {recipes folder already holds a file, install run again} => the file is left untouched', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'siegelense-start-install-recipes-untouched' }),
      });

      const dungeonmasterHomePath = `${testbed.guildPath}/.dm-home`;
      process.env.DUNGEONMASTER_HOME = dungeonmasterHomePath;

      await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: `${testbed.guildPath}/.wrong-cli-root` }),
        },
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'packages/hydration-recipes/src/marker.txt' }),
        content: FileContentStub({ value: 'do not touch\n' }),
      });

      await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: `${testbed.guildPath}/.wrong-cli-root` }),
        },
      });

      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

      const markerContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'packages/hydration-recipes/src/marker.txt' }),
      });

      testbed.cleanup();

      expect(markerContent).toBe('do not touch\n');
    });
  });

  describe('path shape of the result', () => {
    it('VALID: {fresh target} => the resolved siegelense root embedded in the result message names the dungeonmaster home, not targetProjectRoot or context.dungeonmasterRoot', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'siegelense-start-install-absolute-path' }),
      });

      const dungeonmasterHomePath = `${testbed.guildPath}/.dm-home`;
      process.env.DUNGEONMASTER_HOME = dungeonmasterHomePath;

      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: `${testbed.guildPath}/.wrong-cli-root` }),
        },
      });

      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

      testbed.cleanup();

      const afterArrow = String(String(result.message).split(' -> ')[1]);
      const resolvedTarget = String(afterArrow.split(';')[0]);

      expect(resolvedTarget).toBe(`${dungeonmasterHomePath}/siegelense`);
    });

    it('VALID: {fresh target} => every path the result message hands back is absolute', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'siegelense-start-install-every-path-absolute' }),
      });

      const dungeonmasterHomePath = `${testbed.guildPath}/.dm-home`;
      process.env.DUNGEONMASTER_HOME = dungeonmasterHomePath;

      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: `${testbed.guildPath}/.wrong-cli-root` }),
        },
      });

      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

      testbed.cleanup();

      // Every clause the flow joins into `message` with '; ' names a real filesystem path only
      // where it carries a `-> ` marker (the link-create clause) — the ignore-write and
      // recipes-scaffold clauses name REPO-RELATIVE labels (`.gitignore`, `packages/.../src/`) by
      // design, so they are excluded rather than failed against absoluteness.
      const handedBackPaths = String(result.message)
        .split('; ')
        .filter((clause) => clause.includes(' -> '))
        .map((clause) => String(clause.split(' -> ')[1]));
      const absoluteFlags = handedBackPaths.map((candidatePath) => candidatePath.startsWith('/'));

      // A literal [true], not handedBackPaths.map(() => true): comparing against a count derived
      // from the same extraction would pass vacuously if the extraction found nothing at all.
      expect(absoluteFlags).toStrictEqual([true]);
    });
  });
});
