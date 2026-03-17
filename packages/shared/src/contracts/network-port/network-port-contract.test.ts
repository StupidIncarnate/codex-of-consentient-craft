import { networkPortContract } from './network-port-contract';
import { NetworkPortStub } from './network-port.stub';

type NetworkPort = ReturnType<typeof NetworkPortStub>;

describe('networkPortContract', () => {
  describe('valid ports', () => {
    it('VALID: {value: 5737} => parses successfully', () => {
      const port: NetworkPort = NetworkPortStub({ value: 5737 });

      const result = networkPortContract.parse(port);

      expect(result).toStrictEqual(port);
    });

    it('VALID: {value: 1} => parses minimum port', () => {
      const port: NetworkPort = NetworkPortStub({ value: 1 });

      const result = networkPortContract.parse(port);

      expect(result).toStrictEqual(port);
    });

    it('VALID: {value: 65535} => parses maximum port', () => {
      const MAX_PORT = 65_535;
      const port: NetworkPort = NetworkPortStub({ value: MAX_PORT });

      const result = networkPortContract.parse(port);

      expect(result).toStrictEqual(port);
    });
  });

  describe('invalid ports', () => {
    it('INVALID: {value: 0} => throws validation error', () => {
      expect(() => networkPortContract.parse(0)).toThrow(/too_small/u);
    });

    it('INVALID: {value: 65536} => throws validation error', () => {
      const OVER_MAX = 65_536;

      expect(() => networkPortContract.parse(OVER_MAX)).toThrow(/too_big/u);
    });

    it('INVALID: {value: 3.5} => throws validation error for non-integer', () => {
      const NON_INTEGER = 3.5;

      expect(() => networkPortContract.parse(NON_INTEGER)).toThrow(/Expected integer/u);
    });
  });
});
