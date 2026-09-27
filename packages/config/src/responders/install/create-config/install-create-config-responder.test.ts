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

      // String-exact: the write ends in exactly one trailing newline, never zero and never two.
      const writtenConfig = String(proxy.getWrittenConfig());

      expect(writtenConfig.endsWith('\n')).toBe(true);
      expect(writtenConfig.endsWith('\n\n')).toBe(false);
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

    it('VALID: {context: no existing config} => seeds an empty gateway key', async () => {
      const proxy = InstallCreateConfigResponderProxy();

      proxy.setupConfigNotExists();

      await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      const written = JSON.parse(String(proxy.getWrittenConfig())) as Record<PropertyKey, unknown>;

      expect(written.gateway).toStrictEqual({});
    });
  });

  describe('existing config already has devServer.e2e and gateway', () => {
    it('VALID: {context: existing config with both configured} => skips, leaving the file untouched', async () => {
      const proxy = InstallCreateConfigResponderProxy();

      proxy.setupExistingConfigContent({
        content: JSON.stringify({
          framework: 'react',
          schema: 'zod',
          gateway: {},
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

  describe('existing config missing both devServer.e2e and gateway', () => {
    it('VALID: {context: existing config with a devServer block, no e2e, no gateway} => adds both and keeps every other key', async () => {
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
        message:
          'Added the devServer.e2e.processes placeholder and the gateway key to existing .dungeonmaster.json',
      });

      const writtenConfig = String(proxy.getWrittenConfig());
      const written = JSON.parse(writtenConfig) as Record<PropertyKey, unknown>;

      expect(written).toStrictEqual({
        framework: 'monorepo',
        schema: 'zod',
        customTopLevelField: 'keep-me',
        gateway: {},
        devServer: {
          devCommand: 'custom dev command',
          port: 4001,
          customDevServerField: 'also-keep-me',
          e2e: { processes: [e2eProcessPlaceholderStatics.process] },
        },
      });
      // String-exact: the merged write also ends in exactly one trailing newline.
      expect(writtenConfig.endsWith('\n')).toBe(true);
      expect(writtenConfig.endsWith('\n\n')).toBe(false);
    });

    it('VALID: {context: existing config with no devServer at all} => creates devServer, adds the placeholder, and adds gateway', async () => {
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
        gateway: {},
        devServer: {
          e2e: { processes: [e2eProcessPlaceholderStatics.process] },
        },
      });
    });
  });

  describe('existing config has devServer.e2e but no gateway', () => {
    it('VALID: {context: existing config with devServer.e2e, no gateway} => adds only the gateway key', async () => {
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
        message: 'Added the gateway key to existing .dungeonmaster.json',
      });

      const written = JSON.parse(String(proxy.getWrittenConfig())) as Record<PropertyKey, unknown>;

      expect(written).toStrictEqual({
        framework: 'react',
        schema: 'zod',
        gateway: {},
        devServer: {
          devCommand: 'npm run dev',
          port: 3000,
          e2e: {
            processes: [{ name: 'api', command: 'npm start', portRole: 'api', readyPath: '/' }],
          },
        },
      });
    });
  });

  describe('existing config has gateway but no devServer.e2e', () => {
    it('VALID: {context: existing config with a non-empty gateway, no e2e} => adds only the placeholder and keeps gateway untouched', async () => {
      const proxy = InstallCreateConfigResponderProxy();

      proxy.setupExistingConfigContent({
        content: JSON.stringify({
          framework: 'react',
          schema: 'zod',
          gateway: {
            bannedExports: [
              {
                subpath: '#gateway/node/fs',
                name: 'readFileSync',
                use: 'readFile',
                reason: 'blocks the event loop',
              },
            ],
          },
          devServer: {
            devCommand: 'npm run dev',
            port: 3000,
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
        framework: 'react',
        schema: 'zod',
        gateway: {
          bannedExports: [
            {
              subpath: '#gateway/node/fs',
              name: 'readFileSync',
              use: 'readFile',
              reason: 'blocks the event loop',
            },
          ],
        },
        devServer: {
          devCommand: 'npm run dev',
          port: 3000,
          e2e: { processes: [e2eProcessPlaceholderStatics.process] },
        },
      });
    });
  });

  describe('existing config that fails validation', () => {
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

  describe('existing config that cannot be safely read', () => {
    it('INVALID: {context: existing .dungeonmaster.json is not valid JSON} => leaves it untouched, reports it is corrupt, and skips the write', async () => {
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
        error: 'Invalid JSON in /project/.dungeonmaster.json',
      });
      expect(proxy.getWrittenConfig()).toBe(undefined);
    });

    it('ERROR: {context: existing .dungeonmaster.json cannot be read (EACCES)} => leaves it untouched, reports it is unreadable, and skips the write', async () => {
      const proxy = InstallCreateConfigResponderProxy();

      proxy.setupExistingConfigUnreadable();

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
        message: '.dungeonmaster.json exists but could not be read — left untouched',
        error: "EACCES: open '/project/.dungeonmaster.json'",
      });
      expect(proxy.getWrittenConfig()).toBe(undefined);
    });
  });
});
