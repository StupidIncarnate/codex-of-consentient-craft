import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';
import { GuildPathStub } from '@dungeonmaster/shared/contracts';

import { DirectoryFlow } from './directory-flow';

describe('DirectoryFlow', () => {
  describe('return shape', () => {
    it('VALID: {path: directory with one subdirectory} => returns entry with name, path, and isDirectory', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'dir-flow-shape' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'some-folder/.keep' }),
        content: FileContentStub({ value: '' }),
      });

      const result = DirectoryFlow({ path: GuildPathStub({ value: testbed.guildPath }) });

      testbed.cleanup();

      expect(result).toStrictEqual([
        {
          name: 'some-folder',
          path: `${testbed.guildPath}/some-folder`,
          isDirectory: true,
        },
      ]);
    });
  });

  describe('hidden directories excluded', () => {
    it('VALID: {path: directory with hidden and visible subdirs} => hidden directories are excluded', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'dir-flow-hidden' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'visible-folder/.keep' }),
        content: FileContentStub({ value: '' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.hidden-folder/.keep' }),
        content: FileContentStub({ value: '' }),
      });

      const result = DirectoryFlow({ path: GuildPathStub({ value: testbed.guildPath }) });

      testbed.cleanup();

      expect(result).toStrictEqual([
        {
          name: 'visible-folder',
          path: `${testbed.guildPath}/visible-folder`,
          isDirectory: true,
        },
      ]);
    });
  });

  describe('files excluded', () => {
    it('VALID: {path: directory with subdirectory and file} => only directories returned, files excluded', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'dir-flow-files-excluded' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'a-subfolder/.keep' }),
        content: FileContentStub({ value: '' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'a-file.txt' }),
        content: FileContentStub({ value: 'content' }),
      });

      const result = DirectoryFlow({ path: GuildPathStub({ value: testbed.guildPath }) });

      testbed.cleanup();

      expect(result).toStrictEqual([
        {
          name: 'a-subfolder',
          path: `${testbed.guildPath}/a-subfolder`,
          isDirectory: true,
        },
      ]);
    });
  });

  describe('empty directory', () => {
    it('VALID: {path: empty directory} => returns empty array', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'dir-flow-empty' }),
      });

      const result = DirectoryFlow({ path: GuildPathStub({ value: testbed.guildPath }) });

      testbed.cleanup();

      expect(result).toStrictEqual([]);
    });
  });

  describe('alphabetical sorting', () => {
    it('VALID: {path: directory with multiple subdirectories} => entries sorted alphabetically by name', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'dir-flow-sorted' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'gamma/.keep' }),
        content: FileContentStub({ value: '' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'alpha/.keep' }),
        content: FileContentStub({ value: '' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'beta/.keep' }),
        content: FileContentStub({ value: '' }),
      });

      const result = DirectoryFlow({ path: GuildPathStub({ value: testbed.guildPath }) });

      testbed.cleanup();

      expect(result).toStrictEqual([
        { name: 'alpha', path: `${testbed.guildPath}/alpha`, isDirectory: true },
        { name: 'beta', path: `${testbed.guildPath}/beta`, isDirectory: true },
        { name: 'gamma', path: `${testbed.guildPath}/gamma`, isDirectory: true },
      ]);
    });
  });

  describe('combined filtering and sorting', () => {
    it('VALID: {path: directory with subdirs, hidden dirs, and files} => returns only visible subdirs sorted alphabetically', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'dir-flow-combined' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'gamma/.keep' }),
        content: FileContentStub({ value: '' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'alpha/.keep' }),
        content: FileContentStub({ value: '' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'beta/.keep' }),
        content: FileContentStub({ value: '' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.hidden/.keep' }),
        content: FileContentStub({ value: '' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'ignored.ts' }),
        content: FileContentStub({ value: '' }),
      });

      const result = DirectoryFlow({ path: GuildPathStub({ value: testbed.guildPath }) });

      testbed.cleanup();

      expect(result).toStrictEqual([
        { name: 'alpha', path: `${testbed.guildPath}/alpha`, isDirectory: true },
        { name: 'beta', path: `${testbed.guildPath}/beta`, isDirectory: true },
        { name: 'gamma', path: `${testbed.guildPath}/gamma`, isDirectory: true },
      ]);
    });
  });

  describe('default path (no path provided)', () => {
    it('VALID: {path: undefined} => returns array of directory entries from home directory', () => {
      const result = DirectoryFlow({});

      expect(Array.isArray(result)).toBe(true);

      for (const entry of result) {
        expect(entry.isDirectory).toBe(true);
        expect(entry.name.startsWith('.')).toBe(false);
      }

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('error cases', () => {
    it('ERROR: {path: nonexistent directory} => throws ENOENT error', () => {
      expect(() =>
        DirectoryFlow({
          path: GuildPathStub({ value: '/nonexistent-path-that-does-not-exist-12345' }),
        }),
      ).toThrow(/ENOENT/u);
    });
  });
});
