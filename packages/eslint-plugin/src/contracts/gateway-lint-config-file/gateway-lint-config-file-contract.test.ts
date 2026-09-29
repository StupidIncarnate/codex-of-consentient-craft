import { gatewayLintConfigFileContract } from './gateway-lint-config-file-contract';
import { GatewayLintConfigFileStub } from './gateway-lint-config-file.stub';

describe('gateway-lint-config-file-contract', () => {
  describe('valid files', () => {
    it('VALID: {} => parses with gateway undefined', () => {
      const file = GatewayLintConfigFileStub();

      expect(file).toStrictEqual({});
    });

    it('VALID: {framework, gateway with restrictedTo} => keeps other keys and validates gateway', () => {
      const file = gatewayLintConfigFileContract.parse({
        framework: 'monorepo',
        gateway: {
          restrictedTo: [
            { subpath: '#gateway/node/fs', packages: ['shared'], reason: 'owned by shared' },
          ],
        },
      });

      expect(file).toStrictEqual({
        framework: 'monorepo',
        gateway: {
          restrictedTo: [
            { subpath: '#gateway/node/fs', packages: ['shared'], reason: 'owned by shared' },
          ],
        },
      });
    });
  });

  describe('invalid files', () => {
    it('INVALID: {gateway: banned entry missing use} => safeParse fails', () => {
      const result = gatewayLintConfigFileContract.safeParse({
        gateway: { bannedExports: [{ subpath: '#gateway/node/fs', name: 'readFileSync' }] },
      });

      expect(result.success).toBe(false);
    });

    it('INVALID: {a JSON array} => safeParse fails', () => {
      const result = gatewayLintConfigFileContract.safeParse([]);

      expect(result.success).toBe(false);
    });
  });
});
