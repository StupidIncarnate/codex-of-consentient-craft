import { maxIterationsContract } from './max-iterations-contract';
import type { MaxIterationsStub } from './max-iterations.stub';

type MaxIterations = ReturnType<typeof MaxIterationsStub>;

describe('maxIterationsContract', () => {
  describe('valid inputs', () => {
    it('VALID: {1} => returns branded MaxIterations', () => {
      const result: MaxIterations = maxIterationsContract.parse(1);

      expect(result).toBe(1);
    });

    it('VALID: {5} => returns branded MaxIterations', () => {
      const result: MaxIterations = maxIterationsContract.parse(5);

      expect(result).toBe(5);
    });

    it('VALID: {100} => returns branded MaxIterations', () => {
      const result: MaxIterations = maxIterationsContract.parse(100);

      expect(result).toBe(100);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {0} => throws validation error', () => {
      expect(() => maxIterationsContract.parse(0)).toThrow(/greater than 0/iu);
    });

    it('INVALID: {-1} => throws validation error', () => {
      expect(() => maxIterationsContract.parse(-1)).toThrow(/greater than 0/iu);
    });

    it('INVALID: {1.5} => throws validation error', () => {
      expect(() => maxIterationsContract.parse(1.5)).toThrow(/integer/iu);
    });

    it('INVALID: {string} => throws validation error', () => {
      expect(() => maxIterationsContract.parse('5' as never)).toThrow(/number/iu);
    });

    it('INVALID: {null} => throws validation error', () => {
      expect(() => maxIterationsContract.parse(null)).toThrow(/number/iu);
    });
  });
});

describe('MaxIterationsStub', () => {
  it('VALID: {default} => returns 5', () => {
    const { MaxIterationsStub: Stub } = require('./max-iterations.stub');
    const result = Stub();

    expect(result).toBe(5);
  });

  it('VALID: {custom value} => returns custom value', () => {
    const { MaxIterationsStub: Stub } = require('./max-iterations.stub');
    const result = Stub({ value: 10 });

    expect(result).toBe(10);
  });
});
