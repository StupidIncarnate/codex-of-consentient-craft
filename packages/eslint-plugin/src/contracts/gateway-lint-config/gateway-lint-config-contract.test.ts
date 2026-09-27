import { gatewayLintConfigContract } from './gateway-lint-config-contract';
import { GatewayLintConfigStub } from './gateway-lint-config.stub';

describe('gateway-lint-config-contract', () => {
  describe('empty config', () => {
    it('VALID: {} => parses with both arrays undefined', () => {
      const config = GatewayLintConfigStub();

      expect(config).toStrictEqual({});
    });
  });

  describe('bannedExports', () => {
    it('VALID: one entry => parses the full shape', () => {
      const config = GatewayLintConfigStub({
        bannedExports: [
          {
            subpath: '#gateway/node/fs',
            name: 'readFileSync',
            use: 'readFile',
            reason: 'blocks the event loop',
          },
        ],
      });

      expect(config).toStrictEqual({
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

    it('INVALID: entry with empty subpath => throws validation error', () => {
      expect(() => {
        return gatewayLintConfigContract.parse({
          bannedExports: [{ subpath: '', name: 'readFileSync', use: 'readFile', reason: 'why' }],
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID: entry missing use => throws validation error', () => {
      expect(() => {
        return gatewayLintConfigContract.parse({
          bannedExports: [{ subpath: '#gateway/node/fs', name: 'readFileSync', reason: 'why' }],
        });
      }).toThrow(/Required/u);
    });
  });

  describe('restrictedTo', () => {
    it('VALID: entry without name => restricts the whole subpath', () => {
      const config = GatewayLintConfigStub({
        restrictedTo: [
          {
            subpath: '#gateway/bin/spawn',
            packages: ['@dungeonmaster/orchestrator'],
            reason: 'only orchestrator spawns',
          },
        ],
      });

      expect(config.restrictedTo).toStrictEqual([
        {
          subpath: '#gateway/bin/spawn',
          packages: ['@dungeonmaster/orchestrator'],
          reason: 'only orchestrator spawns',
        },
      ]);
    });

    it('VALID: entry with name => restricts only that export', () => {
      const config = GatewayLintConfigStub({
        restrictedTo: [
          {
            subpath: '#gateway/npm/testing-library__react',
            name: 'render',
            packages: ['@dungeonmaster/testing'],
            reason: 'wrap it in @dungeonmaster/testing render',
          },
        ],
      });

      expect(config.restrictedTo?.[0]?.name).toBe('render');
    });

    it('INVALID: entry with empty packages array => throws validation error', () => {
      expect(() => {
        return gatewayLintConfigContract.parse({
          restrictedTo: [{ subpath: '#gateway/bin/spawn', packages: [], reason: 'why' }],
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID: entry missing reason => throws validation error', () => {
      expect(() => {
        return gatewayLintConfigContract.parse({
          restrictedTo: [
            { subpath: '#gateway/bin/spawn', packages: ['@dungeonmaster/orchestrator'] },
          ],
        });
      }).toThrow(/Required/u);
    });
  });
});
