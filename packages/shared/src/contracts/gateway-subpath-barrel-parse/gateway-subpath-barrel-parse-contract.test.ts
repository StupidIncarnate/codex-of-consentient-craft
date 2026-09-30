import { GatewaySubpathBarrelParseStub } from './gateway-subpath-barrel-parse.stub';
import { gatewaySubpathBarrelParseContract } from './gateway-subpath-barrel-parse-contract';

describe('gatewaySubpathBarrelParseContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = GatewaySubpathBarrelParseStub();

      expect(gatewaySubpathBarrelParseContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {realModule: wrong type} => throws', () => {
      expect(() =>
        gatewaySubpathBarrelParseContract.parse({
          ...GatewaySubpathBarrelParseStub(),
          realModule: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
