import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { InstallWriteScriptsResponderProxy } from './install-write-scripts-responder.proxy';
import { installScriptsStatics } from '../../../statics/install-scripts/install-scripts-statics';

describe('InstallWriteScriptsResponder', () => {
  describe('no package.json', () => {
    it('VALID: {no package.json} => returns skipped with failure', async () => {
      const proxy = InstallWriteScriptsResponderProxy();

      proxy.setupFileNotExists();

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/ward',
        success: false,
        action: 'skipped',
        message: 'No package.json found',
      });
    });
  });

  describe('invalid package.json', () => {
    it('VALID: {non-object JSON} => returns skipped with failure', async () => {
      const proxy = InstallWriteScriptsResponderProxy();

      proxy.setupFileExists();
      proxy.setupReadFileContent({ content: '"not-an-object"' });

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/ward',
        success: false,
        action: 'skipped',
        message: 'Invalid package.json',
      });
    });
  });

  describe('no ward scripts present', () => {
    it('VALID: {no scripts} => appends all ward scripts after existing keys', async () => {
      const proxy = InstallWriteScriptsResponderProxy();

      proxy.setupFileExists();
      proxy.setupReadFileContent({
        content: JSON.stringify({ name: 'proj', version: '1.0.0' }),
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
        action: 'created',
        message: 'Added ward scripts to package.json',
      });

      expect(String(proxy.getWrittenPath())).toBe('/project/package.json');
      // String-exact: proves name/version stay first and scripts is appended (not hoisted).
      expect(String(proxy.getWrittenContent())).toBe(
        JSON.stringify(
          { name: 'proj', version: '1.0.0', scripts: installScriptsStatics.scripts },
          null,
          2,
        ),
      );
    });
  });

  describe('some ward scripts present', () => {
    it('VALID: {custom ward script} => preserves it and adds only the missing scripts', async () => {
      const proxy = InstallWriteScriptsResponderProxy();

      proxy.setupFileExists();
      proxy.setupReadFileContent({
        content: JSON.stringify({ name: 'proj', scripts: { ward: 'custom-ward' } }),
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
        action: 'created',
        message: 'Added ward scripts to package.json',
      });

      expect(String(proxy.getWrittenContent())).toBe(
        JSON.stringify(
          {
            name: 'proj',
            scripts: {
              ward: 'custom-ward',
              lint: installScriptsStatics.scripts.lint,
              typecheck: installScriptsStatics.scripts.typecheck,
              test: installScriptsStatics.scripts.test,
            },
          },
          null,
          2,
        ),
      );
    });
  });

  describe('all ward scripts present', () => {
    it('VALID: {all scripts already defined} => skips installation', async () => {
      const proxy = InstallWriteScriptsResponderProxy();

      proxy.setupFileExists();
      proxy.setupReadFileContent({
        content: JSON.stringify({ name: 'proj', scripts: installScriptsStatics.scripts }),
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
        message: 'All ward scripts already present',
      });
    });
  });
});
