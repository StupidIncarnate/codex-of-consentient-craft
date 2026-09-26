import { gatewayPackageNamesContract } from './gateway-package-names-contract';
import { GatewayPackageNamesStub } from './gateway-package-names.stub';

describe('gatewayPackageNamesContract', () => {
  describe('valid inputs', () => {
    it('VALID: {all three names} => parses successfully', () => {
      const result = gatewayPackageNamesContract.parse(GatewayPackageNamesStub());

      expect(result).toStrictEqual({
        node: '@dungeonmaster/node',
        bin: '@dungeonmaster/bin',
        browser: '@dungeonmaster/browser',
      });
    });
  });

  describe('empty input', () => {
    it('EMPTY: {no fields} => parses to an object with every field absent', () => {
      const result = gatewayPackageNamesContract.parse({});

      expect(result).toStrictEqual({});
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {node: ""} => throws validation error', () => {
      expect(() =>
        gatewayPackageNamesContract.parse(GatewayPackageNamesStub({ node: '' })),
      ).toThrow(/at least 1/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates all three gateway names', () => {
      const result = GatewayPackageNamesStub();

      expect(result).toStrictEqual({
        node: '@dungeonmaster/node',
        bin: '@dungeonmaster/bin',
        browser: '@dungeonmaster/browser',
      });
    });
  });
});
