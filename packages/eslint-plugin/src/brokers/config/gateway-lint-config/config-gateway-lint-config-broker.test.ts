import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
import { configGatewayLintConfigBroker } from './config-gateway-lint-config-broker';
import { configGatewayLintConfigBrokerProxy } from './config-gateway-lint-config-broker.proxy';

describe('configGatewayLintConfigBroker', () => {
  describe('no .dungeonmaster.json anywhere', () => {
    it('EMPTY: {no ancestor holds .dungeonmaster.json} => returns an empty config', () => {
      const proxy = configGatewayLintConfigBrokerProxy();
      proxy.setupNoDungeonmasterConfigAt({ configDir: '/orphan/src' });
      proxy.setupNoDungeonmasterConfigAt({ configDir: '/orphan' });
      proxy.setupNoDungeonmasterConfigAt({ configDir: '/' });

      const result = configGatewayLintConfigBroker({
        startDir: FilePathStub({ value: '/orphan/src' }),
      });

      expect(result).toStrictEqual({});
    });
  });

  describe('.dungeonmaster.json with no gateway key', () => {
    it('VALID: {config: framework only, no gateway key} => returns an empty config', () => {
      const proxy = configGatewayLintConfigBrokerProxy();
      proxy.setupDungeonmasterConfig({
        configDir: '/repo',
        contents: JSON.stringify({ framework: 'monorepo', schema: 'zod' }),
      });

      const result = configGatewayLintConfigBroker({ startDir: FilePathStub({ value: '/repo' }) });

      expect(result).toStrictEqual({});
    });
  });

  describe('.dungeonmaster.json found by walking up from a nested directory', () => {
    it('VALID: {startDir nested under the repo root} => climbs up and returns the parsed gateway key', () => {
      const proxy = configGatewayLintConfigBrokerProxy();
      proxy.setupNoDungeonmasterConfigAt({
        configDir: '/repo/packages/eslint-plugin/src/brokers/config',
      });
      proxy.setupNoDungeonmasterConfigAt({ configDir: '/repo/packages/eslint-plugin/src/brokers' });
      proxy.setupNoDungeonmasterConfigAt({ configDir: '/repo/packages/eslint-plugin/src' });
      proxy.setupNoDungeonmasterConfigAt({ configDir: '/repo/packages/eslint-plugin' });
      proxy.setupNoDungeonmasterConfigAt({ configDir: '/repo/packages' });
      proxy.setupDungeonmasterConfig({
        configDir: '/repo',
        contents: JSON.stringify({
          framework: 'monorepo',
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
        }),
      });

      const result = configGatewayLintConfigBroker({
        startDir: FilePathStub({ value: '/repo/packages/eslint-plugin/src/brokers/config' }),
      });

      expect(result).toStrictEqual({
        bannedExports: [
          {
            subpath: '#gateway/node/fs',
            name: 'readFileSync',
            use: 'readFile',
            reason: 'blocks the event loop',
          },
        ],
      });
    });
  });

  describe('.dungeonmaster.json is not valid JSON', () => {
    it('ERROR: {config: corrupt JSON} => returns an empty config rather than throwing', () => {
      const proxy = configGatewayLintConfigBrokerProxy();
      proxy.setupDungeonmasterConfig({ configDir: '/repo', contents: '{ not valid json' });

      const result = configGatewayLintConfigBroker({ startDir: FilePathStub({ value: '/repo' }) });

      expect(result).toStrictEqual({});
    });
  });

  describe('.dungeonmaster.json has an invalid gateway key', () => {
    it('INVALID: {config: gateway.bannedExports entry missing required fields} => returns an empty config rather than throwing', () => {
      const proxy = configGatewayLintConfigBrokerProxy();
      proxy.setupDungeonmasterConfig({
        configDir: '/repo',
        contents: JSON.stringify({
          framework: 'monorepo',
          schema: 'zod',
          gateway: { bannedExports: [{ subpath: '#gateway/node/fs' }] },
        }),
      });

      const result = configGatewayLintConfigBroker({ startDir: FilePathStub({ value: '/repo' }) });

      expect(result).toStrictEqual({});
    });
  });
});
