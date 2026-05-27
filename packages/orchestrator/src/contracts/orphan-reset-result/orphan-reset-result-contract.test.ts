import { orphanResetResultContract } from './orphan-reset-result-contract';
import { OrphanResetResultStub } from './orphan-reset-result.stub';

describe('orphanResetResultContract', () => {
  describe('valid input', () => {
    it('VALID: {orphansReset: 0} => parses to branded result', () => {
      const result = orphanResetResultContract.parse({ orphansReset: 0 });

      expect(result).toStrictEqual({ orphansReset: 0 });
    });

    it('VALID: {orphansReset: 3} => parses to branded result', () => {
      const result = orphanResetResultContract.parse(OrphanResetResultStub({ orphansReset: 3 }));

      expect(result).toStrictEqual({ orphansReset: 3 });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {orphansReset: -1} => throws', () => {
      expect(() => orphanResetResultContract.parse({ orphansReset: -1 })).toThrow(
        /greater than or equal to 0/u,
      );
    });

    it('INVALID: {orphansReset: 1.5} => throws', () => {
      expect(() => orphanResetResultContract.parse({ orphansReset: 1.5 })).toThrow(/integer/u);
    });

    it('INVALID: {orphansReset: "five"} => throws', () => {
      expect(() => orphanResetResultContract.parse({ orphansReset: 'five' })).toThrow(
        /Expected number/u,
      );
    });
  });
});
