import { gatewayLintConfigReadBroker } from './gateway-lint-config-read-broker';
import { gatewayLintConfigReadBrokerProxy } from './gateway-lint-config-read-broker.proxy';

describe('gatewayLintConfigReadBroker', () => {
  describe('no .dungeonmaster.json at the repo root', () => {
    it('EMPTY: {repoRoot has no config file} => returns {}', () => {
      const proxy = gatewayLintConfigReadBrokerProxy();
      const repoRoot = '/repo';
      proxy.setupMissingConfig({
        configPath: '/repo/.dungeonmaster.json',
      });

      const result = gatewayLintConfigReadBroker({ repoRoot });

      expect(result).toStrictEqual({});
    });
  });

  describe('a config file with no gateway key', () => {
    it('EMPTY: {.dungeonmaster.json has no "gateway" key} => returns {}', () => {
      const proxy = gatewayLintConfigReadBrokerProxy();
      const repoRoot = '/repo';
      const configPath = '/repo/.dungeonmaster.json';
      proxy.setupConfig({
        configPath,
        fileContent: JSON.stringify({ framework: 'monorepo' }),
      });

      const result = gatewayLintConfigReadBroker({ repoRoot });

      expect(result).toStrictEqual({});
    });
  });

  describe('a config file with a gateway key', () => {
    it('VALID: {gateway key with bannedExports} => returns the validated gateway config', () => {
      const proxy = gatewayLintConfigReadBrokerProxy();
      const repoRoot = '/repo';
      const configPath = '/repo/.dungeonmaster.json';
      proxy.setupConfig({
        configPath,
        fileContent: JSON.stringify({
          gateway: {
            bannedExports: [
              {
                subpath: '#gateway/node/fs',
                name: 'readFileSync',
                use: 'readFile',
                reason: 'blocks the loop',
              },
            ],
          },
        }),
      });

      const result = gatewayLintConfigReadBroker({ repoRoot });

      expect(result).toStrictEqual({
        bannedExports: [
          {
            subpath: '#gateway/node/fs',
            name: 'readFileSync',
            use: 'readFile',
            reason: 'blocks the loop',
          },
        ],
      });
    });
  });

  describe('a config file that fails to parse as JSON', () => {
    it('ERROR: {.dungeonmaster.json is not valid JSON} => returns {} rather than throwing', () => {
      const proxy = gatewayLintConfigReadBrokerProxy();
      const repoRoot = '/repo';
      const configPath = '/repo/.dungeonmaster.json';
      proxy.setupConfig({ configPath, fileContent: '{not json' });

      const result = gatewayLintConfigReadBroker({ repoRoot });

      expect(result).toStrictEqual({});
    });
  });

  describe('a gateway key that fails its own schema', () => {
    it('ERROR: {gateway.bannedExports entry missing "use"} => returns {} rather than throwing', () => {
      const proxy = gatewayLintConfigReadBrokerProxy();
      const repoRoot = '/repo';
      const configPath = '/repo/.dungeonmaster.json';
      proxy.setupConfig({
        configPath,
        fileContent: JSON.stringify({
          gateway: {
            bannedExports: [{ subpath: '#gateway/node/fs', name: 'readFileSync' }],
          },
        }),
      });

      const result = gatewayLintConfigReadBroker({ repoRoot });

      expect(result).toStrictEqual({});
    });
  });
});
