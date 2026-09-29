import { ContractParseSiteStub } from './contract-parse-site.stub';
import { contractParseSiteContract } from './contract-parse-site-contract';

describe('contractParseSiteContract', () => {
  describe('valid input', () => {
    it('VALID: {defaults} => returns the stub file and line', () => {
      const result = ContractParseSiteStub();

      expect(result).toStrictEqual({
        filePath: '/repo/packages/example/src/brokers/thing/thing-broker.ts',
        line: 12,
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {line: 0} => throws ZodError', () => {
      expect(() => contractParseSiteContract.parse({ filePath: '/repo/a.ts', line: 0 })).toThrow(
        /too small/iu,
      );
    });

    it('INVALID: {filePath: relative} => throws ZodError', () => {
      expect(() => contractParseSiteContract.parse({ filePath: 'a.ts', line: 1 })).toThrow(
        /Path must be absolute/u,
      );
    });
  });
});
