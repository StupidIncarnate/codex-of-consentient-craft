import { nestedChainArgsContract } from './nested-chain-args-contract';
import { NestedChainArgsStub } from './nested-chain-args.stub';

describe('nestedChainArgsContract', () => {
  describe('valid nested chain args', () => {
    it('VALID: {depth: 2} => parses to exactly that one field', () => {
      const result = nestedChainArgsContract.parse({ depth: 2 });

      expect(result).toStrictEqual({ depth: 2 });
    });

    it('VALID: {depth: 1} => parses the minimum positive depth', () => {
      const result = nestedChainArgsContract.parse({ depth: 1 });

      expect(result).toStrictEqual({ depth: 1 });
    });

    it('VALID: {stub with depth override} => parses with the overridden depth', () => {
      const result = NestedChainArgsStub({ depth: 3 });

      expect(result.depth).toBe(3);
    });
  });

  describe('invalid nested chain args', () => {
    it('INVALID: {depth: 0} => throws "Number must be greater than 0"', () => {
      expect(() => nestedChainArgsContract.parse({ depth: 0 })).toThrow(
        /Number must be greater than 0/u,
      );
    });

    it('INVALID: {depth: -1} => throws "Number must be greater than 0"', () => {
      expect(() => nestedChainArgsContract.parse({ depth: -1 })).toThrow(
        /Number must be greater than 0/u,
      );
    });

    it('INVALID: {depth: 1.5} => throws "Expected integer, received float"', () => {
      expect(() => nestedChainArgsContract.parse({ depth: 1.5 })).toThrow(
        /Expected integer, received float/u,
      );
    });

    it('INVALID: {depth: "2"} => throws "Expected number, received string"', () => {
      expect(() => nestedChainArgsContract.parse({ depth: '2' as never })).toThrow(
        /Expected number, received string/u,
      );
    });
  });

  describe('empty nested chain args', () => {
    it('EMPTY: {} => throws "Required"', () => {
      expect(() => nestedChainArgsContract.parse({})).toThrow(/Required/u);
    });
  });
});
