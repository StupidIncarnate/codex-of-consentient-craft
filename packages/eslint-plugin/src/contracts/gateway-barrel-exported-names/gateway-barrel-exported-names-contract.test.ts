import { GatewayBarrelExportedNamesStub } from './gateway-barrel-exported-names.stub';
import { gatewayBarrelExportedNamesContract } from './gateway-barrel-exported-names-contract';

describe('gatewayBarrelExportedNamesContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = GatewayBarrelExportedNamesStub();

      expect(gatewayBarrelExportedNamesContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {directNames: wrong type} => throws', () => {
      expect(() =>
        gatewayBarrelExportedNamesContract.parse({
          ...GatewayBarrelExportedNamesStub(),
          directNames: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
