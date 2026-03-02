import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { InstallWriteGitignoreResponderProxy } from './install-write-gitignore-responder.proxy';

describe('InstallWriteGitignoreResponder', () => {
  describe('no existing .gitignore', () => {
    it('VALID: {no .gitignore file} => creates .gitignore with .ward/', async () => {
      const proxy = InstallWriteGitignoreResponderProxy();

      proxy.setupReadFileThrows();

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
        message: 'Created .gitignore with .ward/',
      });

      expect(String(proxy.getWrittenPath())).toMatch(/\.gitignore$/u);
      expect(proxy.getWrittenContent()).toBe('.ward/\n');
    });
  });

  describe('existing .gitignore without .ward/', () => {
    it('VALID: {.gitignore exists without .ward/} => appends .ward/ to .gitignore', async () => {
      const proxy = InstallWriteGitignoreResponderProxy();

      proxy.setupReadFileContent({ content: 'node_modules/\ndist/\n' });

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
        message: 'Added .ward/ to existing .gitignore',
      });

      expect(String(proxy.getWrittenPath())).toMatch(/\.gitignore$/u);
      expect(proxy.getWrittenContent()).toBe('node_modules/\ndist/\n.ward/\n');
    });
  });

  describe('.gitignore already has .ward/', () => {
    it('VALID: {.gitignore already contains .ward/} => skips installation', async () => {
      const proxy = InstallWriteGitignoreResponderProxy();

      proxy.setupReadFileContent({ content: 'node_modules/\n.ward/\n' });

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
        message: '.ward/ already in .gitignore',
      });
    });
  });
});
