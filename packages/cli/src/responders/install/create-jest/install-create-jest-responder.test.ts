import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { InstallCreateJestResponderProxy } from './install-create-jest-responder.proxy';
import { jestConfigTemplateStatics } from '../../../statics/jest-config-template/jest-config-template-statics';

describe('InstallCreateJestResponder', () => {
  describe('no existing jest.config.js', () => {
    it('VALID: {no jest.config.js} => writes the base-spreading jest config', async () => {
      const proxy = InstallCreateJestResponderProxy();

      proxy.setupFileNotExists({ filePath: FilePathStub({ value: '/project/jest.config.js' }) });

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: true,
        action: 'created',
        message: 'Created jest.config.js',
      });

      const writtenFiles = proxy.getWrittenFiles();

      expect(writtenFiles[0]?.path).toBe('/project/jest.config.js');
      expect(writtenFiles[0]?.content).toBe(jestConfigTemplateStatics.content);
    });
  });

  describe('jest.config.js already exists', () => {
    it('VALID: {jest.config.js present} => skips without writing', async () => {
      const proxy = InstallCreateJestResponderProxy();

      proxy.setupFileExists({ filePath: FilePathStub({ value: '/project/jest.config.js' }) });

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: true,
        action: 'skipped',
        message: 'jest.config.js already exists',
      });

      expect(proxy.getWrittenFiles()).toStrictEqual([]);
    });
  });

  describe('target project has npm workspaces', () => {
    it('VALID: {package.json has workspaces} => skips without writing, regardless of jest.config.js', async () => {
      const proxy = InstallCreateJestResponderProxy();

      proxy.setupWorkspacesRoot();

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: true,
        action: 'skipped',
        message: 'target project has npm workspaces (each package owns its own jest.config.js)',
      });

      expect(proxy.getWrittenFiles()).toStrictEqual([]);
    });
  });
});
