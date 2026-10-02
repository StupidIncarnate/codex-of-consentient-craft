import { deleteEnv, setEnv } from '#gateway/node/process';
import { join } from '#gateway/node/path';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { limitsReadBroker } from './limits-read-broker';
import { limitsReadBrokerProxy } from './limits-read-broker.proxy';

describe('limitsReadBroker', () => {
  describe('missing or unparseable config', () => {
    it('EMPTY: {config: missing} => returns defaults with null warning and empty guildPaths', async () => {
      const proxy = limitsReadBrokerProxy();
      proxy.setupMissingConfig();

      const result = await limitsReadBroker();

      expect(result).toStrictEqual({
        resources: {
          maxMemoryPercent: 80,
          maxDiskMB: 4096,
        },
        guildPaths: [],
        warning: null,
      });
    });

    it('ERROR: {config: unparseable JSON} => returns defaults and warning naming JSON parse error', async () => {
      const proxy = limitsReadBrokerProxy();
      proxy.setupUnparseableConfig();

      const result = await limitsReadBroker();

      expect(result).toStrictEqual({
        resources: {
          maxMemoryPercent: 80,
          maxDiskMB: 4096,
        },
        guildPaths: [],
        warning:
          'config.json unparseable: Invalid JSON in /home/test-user/.dungeonmaster/config.json. Using defaults.',
      });
    });
  });

  describe('valid config without resources', () => {
    it('VALID: {config: {guilds: [...]}, resources: missing} => returns defaults with null warning and parsed guildPaths', async () => {
      const proxy = limitsReadBrokerProxy();
      proxy.setupValidConfig({
        guilds: [{ path: '/repo/guild-alpha' }],
      });

      const result = await limitsReadBroker();

      expect(result).toStrictEqual({
        resources: {
          maxMemoryPercent: 80,
          maxDiskMB: 4096,
        },
        guildPaths: ['/repo/guild-alpha'],
        warning: null,
      });
    });
  });

  describe('valid config with resources', () => {
    it('VALID: {config: {resources: {maxMemoryPercent: 75, maxDiskMB: 8192}}} => returns parsed resources with null warning', async () => {
      const proxy = limitsReadBrokerProxy();
      proxy.setupValidConfig({
        resources: {
          maxMemoryPercent: 75,
          maxDiskMB: 8192,
        },
        guilds: [{ path: '/repo/guild-beta' }],
      });

      const result = await limitsReadBroker();

      expect(result).toStrictEqual({
        resources: {
          maxMemoryPercent: 75,
          maxDiskMB: 8192,
        },
        guildPaths: ['/repo/guild-beta'],
        warning: null,
      });
    });
  });

  describe('invalid resources', () => {
    it('INVALID: {config: {resources: {maxMemoryPercent: 200}}} => returns defaults and warning naming percent issue', async () => {
      const proxy = limitsReadBrokerProxy();
      proxy.setupInvalidResources({
        resources: {
          maxMemoryPercent: 200,
        },
      });

      const result = await limitsReadBroker();

      expect(result).toStrictEqual({
        resources: {
          maxMemoryPercent: 80,
          maxDiskMB: 4096,
        },
        guildPaths: [],
        warning:
          'config.json resources invalid: maxMemoryPercent: Too big: expected number to be <=100. Using defaults.',
      });
    });

    it('INVALID: {config: {resources: {maxDiskMB: 500}}} => returns defaults and warning naming min disk issue', async () => {
      const proxy = limitsReadBrokerProxy();
      proxy.setupInvalidResources({
        resources: {
          maxDiskMB: 500,
        },
      });

      const result = await limitsReadBroker();

      expect(result).toStrictEqual({
        resources: {
          maxMemoryPercent: 80,
          maxDiskMB: 4096,
        },
        guildPaths: [],
        warning:
          'config.json resources invalid: maxDiskMB: Too small: expected number to be >=1024. Using defaults.',
      });
    });
  });

  describe('guild paths handling', () => {
    it('VALID: {config: {guilds: [...]}} => extracts valid paths and filters empty/non-string items', async () => {
      const proxy = limitsReadBrokerProxy();
      proxy.setupValidConfig({
        guilds: [
          { path: '/repo/valid-guild-1' },
          { path: '' },
          { name: 'no-path-guild' },
          { path: '/repo/valid-guild-2' },
        ],
      });

      const result = await limitsReadBroker();

      expect(result).toStrictEqual({
        resources: {
          maxMemoryPercent: 80,
          maxDiskMB: 4096,
        },
        guildPaths: ['/repo/valid-guild-1', '/repo/valid-guild-2'],
        warning: null,
      });
    });
  });

  describe('home directory resolution', () => {
    it('VALID: {DUNGEONMASTER_HOME: "/different/home"} => resolves config against homedir(), never DUNGEONMASTER_HOME', async () => {
      const proxy = limitsReadBrokerProxy();
      const testHome = '/home/real-user';
      const dmEnvHome = '/different/dungeonmaster-home';
      setEnv('DUNGEONMASTER_HOME', dmEnvHome);

      proxy.setupValidConfig({
        homeDir: testHome,
        resources: {
          maxMemoryPercent: 65,
          maxDiskMB: 2048,
        },
        guilds: [{ path: '/repo/real-guild' }],
      });

      const envConfigPath = join(
        dmEnvHome,
        dungeonmasterHomeStatics.paths.configDir,
        dungeonmasterHomeStatics.paths.configFile,
      );
      proxy.setupRawPath({
        path: envConfigPath,
        rawContents: JSON.stringify({
          resources: {
            maxMemoryPercent: 95,
            maxDiskMB: 16384,
          },
          guilds: [{ path: '/repo/env-guild' }],
        }),
      });

      const result = await limitsReadBroker();
      deleteEnv('DUNGEONMASTER_HOME');

      expect(proxy.getCallsFor({ path: envConfigPath })).toStrictEqual([]);
      expect(result).toStrictEqual({
        resources: {
          maxMemoryPercent: 65,
          maxDiskMB: 2048,
        },
        guildPaths: ['/repo/real-guild'],
        warning: null,
      });
    });
  });
});
