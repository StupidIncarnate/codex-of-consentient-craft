import { portPairContract } from './port-pair-contract';
import { PortPairStub } from './port-pair.stub';

describe('portPairContract', () => {
  describe('valid pairs', () => {
    it('VALID: {api: 34172, web: 34173} => parses successfully', () => {
      const pair = PortPairStub({ api: 34_172, web: 34_173 });

      const result = portPairContract.parse(pair);

      expect(result).toStrictEqual({ api: 34_172, web: 34_173 });
    });
  });

  describe('edge pairs', () => {
    it('EDGE: {api: 1, web: 65535} => parses at the port range boundaries', () => {
      const pair = PortPairStub({ api: 1, web: 65_535 });

      const result = portPairContract.parse(pair);

      expect(result).toStrictEqual({ api: 1, web: 65_535 });
    });
  });

  describe('invalid pairs', () => {
    it('INVALID: {api: 34173, web: 34173} => throws', () => {
      expect(() => portPairContract.parse({ api: 34_173, web: 34_173 })).toThrow(
        /api and web ports must differ/u,
      );
    });

    it('INVALID: {api: 0, web: 34173} => throws validation error', () => {
      expect(() => portPairContract.parse({ api: 0, web: 34_173 })).toThrow(/too_small/u);
    });

    it('INVALID: {missing web} => throws Required', () => {
      expect(() => portPairContract.parse({ api: 34_172 })).toThrow(/Required/u);
    });
  });
});
