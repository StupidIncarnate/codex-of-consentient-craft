import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { e2eProcessPlaceholderStatics } from '../../../statics/e2e-process-placeholder/e2e-process-placeholder-statics';
import { InstallCreateConfigResponderProxy } from './install-create-config-responder.proxy';

describe('InstallCreateConfigResponder', () => {
  describe('no existing config', () => {
    it('VALID: {context: no existing config} => creates .dungeonmaster.json config', async () => {
      const proxy = InstallCreateConfigResponderProxy();

      proxy.setupConfigNotExists();

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/config',
        success: true,
        action: 'created',
        message: 'Created .dungeonmaster.json',
      });
    });

    it('VALID: {context: no existing config} => seeds the placeholder devServer.e2e.processes entry', async () => {
      const proxy = InstallCreateConfigResponderProxy();

      proxy.setupConfigNotExists();

      await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      const written = JSON.parse(String(proxy.getWrittenConfig())) as Record<PropertyKey, unknown>;
      const devServer = written.devServer as Record<PropertyKey, unknown>;

      expect(devServer.e2e).toStrictEqual({
        processes: [e2eProcessPlaceholderStatics.process],
      });
    });
  });

  describe('existing config already has devServer.e2e', () => {
    it('VALID: {context: existing config with devServer.e2e configured} => skips, leaving the file untouched', async () => {
      const proxy = InstallCreateConfigResponderProxy();

      proxy.setupExistingConfigContent({
        content: JSON.stringify({
          framework: 'react',
          schema: 'zod',
          devServer: {
            devCommand: 'npm run dev',
            port: 3000,
            e2e: {
              processes: [{ name: 'api', command: 'npm start', portRole: 'api', readyPath: '/' }],
            },
          },
        }),
      });

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/config',
        success: true,
        action: 'skipped',
        message: '.dungeonmaster.json already exists',
      });
      expect(proxy.getWrittenConfig()).toBe(undefined);
    });
  });

  describe('existing config without devServer.e2e', () => {
    it('VALID: {context: existing config with a devServer block, no e2e} => adds the placeholder and keeps every other key', async () => {
      const proxy = InstallCreateConfigResponderProxy();

      proxy.setupExistingConfigContent({
        content: JSON.stringify({
          framework: 'monorepo',
          schema: 'zod',
          customTopLevelField: 'keep-me',
          devServer: {
            devCommand: 'custom dev command',
            port: 4001,
            customDevServerField: 'also-keep-me',
          },
        }),
      });
      proxy.setupWriteSucceeds();

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/config',
        success: true,
        action: 'merged',
        message: 'Added the devServer.e2e.processes placeholder to existing .dungeonmaster.json',
      });

      const written = JSON.parse(String(proxy.getWrittenConfig())) as Record<PropertyKey, unknown>;

      expect(written).toStrictEqual({
        framework: 'monorepo',
        schema: 'zod',
        customTopLevelField: 'keep-me',
        devServer: {
          devCommand: 'custom dev command',
          port: 4001,
          customDevServerField: 'also-keep-me',
          e2e: { processes: [e2eProcessPlaceholderStatics.process] },
        },
      });
    });

    it('VALID: {context: existing config with no devServer at all} => creates devServer and adds the placeholder', async () => {
      const proxy = InstallCreateConfigResponderProxy();

      proxy.setupExistingConfigContent({
        content: JSON.stringify({ framework: 'react', schema: 'zod' }),
      });
      proxy.setupWriteSucceeds();

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result.action).toBe('merged');

      const written = JSON.parse(String(proxy.getWrittenConfig())) as Record<PropertyKey, unknown>;

      expect(written).toStrictEqual({
        framework: 'react',
        schema: 'zod',
        devServer: {
          e2e: { processes: [e2eProcessPlaceholderStatics.process] },
        },
      });
    });
  });

  describe('existing config that cannot be safely edited', () => {
    it('INVALID: {context: existing .dungeonmaster.json is not valid JSON} => leaves it untouched and reports why', async () => {
      const proxy = InstallCreateConfigResponderProxy();

      proxy.setupExistingConfigContent({ content: '{ not valid json' });

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/config',
        success: true,
        action: 'skipped',
        message: '.dungeonmaster.json exists but is not valid JSON — left untouched',
      });
      expect(proxy.getWrittenConfig()).toBe(undefined);
    });

    it('INVALID: {context: existing .dungeonmaster.json fails the config contract} => leaves it untouched and reports why', async () => {
      const proxy = InstallCreateConfigResponderProxy();

      proxy.setupExistingConfigContent({
        content: JSON.stringify({ framework: 'not-a-real-framework', schema: 'zod' }),
      });

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/config',
        success: true,
        action: 'skipped',
        message: '.dungeonmaster.json exists but failed config validation — left untouched',
      });
      expect(proxy.getWrittenConfig()).toBe(undefined);
    });
  });
});
