import { gatewayPackageNameContract } from './gateway-package-name-contract';
import { GatewayPackageNameStub } from './gateway-package-name.stub';

describe('gatewayPackageNameContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "@dungeonmaster/node"} => parses successfully', () => {
      const result = gatewayPackageNameContract.parse(GatewayPackageNameStub());

      expect(result).toBe('@dungeonmaster/node');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => gatewayPackageNameContract.parse('')).toThrow(/>=1/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates a gateway package name', () => {
      const result = GatewayPackageNameStub();

      expect(result).toBe('@dungeonmaster/node');
    });
  });
});
