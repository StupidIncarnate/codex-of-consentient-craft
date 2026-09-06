import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { InstallWriteGitignoreResponderProxy } from './install-write-gitignore-responder.proxy';

const ALL_ENTRIES = '.ward/\ntest-results/\n.ward-playwright-report*.json\n';

describe('InstallWriteGitignoreResponder', () => {
  describe('no existing .gitignore', () => {
    it('VALID: {no .gitignore file} => creates one carrying every ward entry', async () => {
      const proxy = InstallWriteGitignoreResponderProxy();
      const filePath = FilePathStub({ value: '/project/.gitignore' });

      proxy.setupReadFileThrows({ filePath });

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/ward',
        success: true,
        action: 'created',
        message: 'Created .gitignore with .ward/, test-results/, .ward-playwright-report*.json',
      });

      expect(String(proxy.getWrittenPath({ filePath }))).toBe('/project/.gitignore');
      expect(proxy.getWrittenContent({ filePath })).toBe(ALL_ENTRIES);
    });
  });

  describe('existing .gitignore carrying none of them', () => {
    it('VALID: {.gitignore exists without any ward entry} => appends all three, keeping what was there', async () => {
      const proxy = InstallWriteGitignoreResponderProxy();
      const filePath = FilePathStub({ value: '/project/.gitignore' });

      proxy.setupReadFileContent({ filePath, content: 'node_modules/\ndist/\n' });

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/ward',
        success: true,
        action: 'merged',
        message:
          'Added .ward/, test-results/, .ward-playwright-report*.json to existing .gitignore',
      });

      expect(String(proxy.getWrittenPath({ filePath }))).toBe('/project/.gitignore');
      expect(proxy.getWrittenContent({ filePath })).toBe(`node_modules/\ndist/\n${ALL_ENTRIES}`);
    });
  });

  describe('existing .gitignore carrying SOME of them', () => {
    // The match is per entry rather than all-or-nothing. A repo that added `.ward/` by hand still
    // needs the other two, and a check on the first line alone would skip them for ever.
    it('VALID: {.gitignore already has .ward/} => appends only the two that are missing', async () => {
      const proxy = InstallWriteGitignoreResponderProxy();
      const filePath = FilePathStub({ value: '/project/.gitignore' });

      proxy.setupReadFileContent({ filePath, content: 'node_modules/\n.ward/\n' });

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/ward',
        success: true,
        action: 'merged',
        message: 'Added test-results/, .ward-playwright-report*.json to existing .gitignore',
      });

      expect(proxy.getWrittenContent({ filePath })).toBe(
        'node_modules/\n.ward/\ntest-results/\n.ward-playwright-report*.json\n',
      );
    });
  });

  describe('existing .gitignore carrying all of them', () => {
    it('VALID: {.gitignore already has every entry} => skips without writing', async () => {
      const proxy = InstallWriteGitignoreResponderProxy();
      const filePath = FilePathStub({ value: '/project/.gitignore' });

      proxy.setupReadFileContent({
        filePath,
        content: `node_modules/\n${ALL_ENTRIES}`,
      });

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/ward',
        success: true,
        action: 'skipped',
        message: '.gitignore already carries every ward entry',
      });
    });
  });
});
