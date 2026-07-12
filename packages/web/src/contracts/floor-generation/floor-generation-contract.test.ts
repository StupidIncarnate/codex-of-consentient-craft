import { floorGenerationContract } from './floor-generation-contract';
import { FloorGenerationStub } from './floor-generation.stub';

describe('floorGenerationContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 0} => parses the original generation', () => {
      const result = floorGenerationContract.parse(0);

      expect(result).toBe(0);
    });

    it('VALID: {value: 2} => parses a later replan generation', () => {
      const result = floorGenerationContract.parse(2);

      expect(result).toBe(2);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: -1} => throws for negative', () => {
      expect(() => floorGenerationContract.parse(-1)).toThrow(
        /Number must be greater than or equal to 0/u,
      );
    });

    it('INVALID: {value: 1.5} => throws for non-integer', () => {
      expect(() => floorGenerationContract.parse(1.5)).toThrow(/Expected integer/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates generation 0', () => {
      const result = FloorGenerationStub();

      expect(result).toBe(0);
    });

    it('VALID: {value: 1} => creates a custom generation', () => {
      const result = FloorGenerationStub({ value: 1 });

      expect(result).toBe(1);
    });
  });
});
