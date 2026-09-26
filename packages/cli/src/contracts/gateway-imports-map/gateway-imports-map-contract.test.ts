import { gatewayImportsMapContract } from './gateway-imports-map-contract';
import { GatewayImportsMapStub } from './gateway-imports-map.stub';

describe('gatewayImportsMapContract', () => {
  describe('valid inputs', () => {
    it('VALID: {four #gateway entries} => parses successfully', () => {
      const result = gatewayImportsMapContract.parse({
        '#gateway/npm/*': '@acme/npm/*',
        '#gateway/node/*': '@acme/node/*',
        '#gateway/browser/*': '@acme/browser/*',
        '#gateway/bin/*': '@acme/bin/*',
      });

      expect(result).toStrictEqual({
        '#gateway/npm/*': '@acme/npm/*',
        '#gateway/node/*': '@acme/node/*',
        '#gateway/browser/*': '@acme/browser/*',
        '#gateway/bin/*': '@acme/bin/*',
      });
    });

    it('VALID: {} => parses empty object', () => {
      const result = gatewayImportsMapContract.parse({});

      expect(result).toStrictEqual({});
    });
  });

  describe('GatewayImportsMapStub', () => {
    it('VALID: {} => returns the default dungeonmaster-scoped stub', () => {
      const result = GatewayImportsMapStub();

      expect(result).toStrictEqual({
        '#gateway/npm/*': '@dungeonmaster/npm/*',
        '#gateway/node/*': '@dungeonmaster/node/*',
        '#gateway/browser/*': '@dungeonmaster/browser/*',
        '#gateway/bin/*': '@dungeonmaster/bin/*',
      });
    });
  });
});
