import { depthCountContract } from './depth-count-contract';
import type { DepthCount } from './depth-count-contract';

describe('depthCountContract', () => {
  describe('parse()', () => {
    it('VALID: {value: 0} => returns branded DepthCount', () => {
      const result = depthCountContract.parse(0);

      expect(result).toBe(0);

      // Type assertion to verify it's branded
      const branded: DepthCount = result;

      expect(branded).toBe(0);
    });

    it('VALID: {value: 1} => returns branded DepthCount', () => {
      const result = depthCountContract.parse(1);

      expect(result).toBe(1);
    });

    it('VALID: {value: 5} => returns branded DepthCount', () => {
      const result = depthCountContract.parse(5);

      expect(result).toBe(5);
    });

    it('INVALID: {value: -1} => throws ZodError', () => {
      expect(() => {
        depthCountContract.parse(-1);
      }).toThrow(/Number must be greater than or equal to 0/u);
    });

    it('INVALID: {value: 1.5} => throws ZodError', () => {
      expect(() => {
        depthCountContract.parse(1.5);
      }).toThrow(/Expected integer, received float/u);
    });

    it('INVALID: {value: "3"} => throws ZodError', () => {
      expect(() => {
        depthCountContract.parse('3' as never);
      }).toThrow(/Expected number, received string/u);
    });
  });
});
