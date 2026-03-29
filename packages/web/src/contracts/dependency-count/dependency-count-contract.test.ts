import { dependencyCountContract } from './dependency-count-contract';
import { DependencyCountStub } from './dependency-count.stub';

describe('dependencyCountContract', () => {
  describe('valid counts', () => {
    it('VALID: {value: 0} => parses zero count', () => {
      const result = dependencyCountContract.parse(DependencyCountStub({ value: 0 }));

      expect(result).toBe(0);
    });

    it('VALID: {value: 3} => parses positive count', () => {
      const result = dependencyCountContract.parse(DependencyCountStub({ value: 3 }));

      expect(result).toBe(3);
    });
  });

  describe('invalid counts', () => {
    it('INVALID: {value: -1} => throws validation error', () => {
      expect(() => dependencyCountContract.parse(-1)).toThrow(/too_small/u);
    });
  });
});
