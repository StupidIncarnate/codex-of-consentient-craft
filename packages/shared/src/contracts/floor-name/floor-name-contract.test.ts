import { floorNameContract } from './floor-name-contract';
import { FloorNameStub } from './floor-name.stub';

describe('floorNameContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "CARTOGRAPHY"} => parses valid floor name', () => {
      const result = floorNameContract.parse('CARTOGRAPHY');

      expect(result).toBe('CARTOGRAPHY');
    });

    it('VALID: {value: "FORGE"} => parses single word', () => {
      const result = floorNameContract.parse('FORGE');

      expect(result).toBe('FORGE');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: ""} => throws for empty string', () => {
      expect(() => floorNameContract.parse('')).toThrow(/String must contain at least 1/u);
    });

    it('INVALID: {value: 123} => throws for number', () => {
      expect(() => floorNameContract.parse(123)).toThrow(/Expected string/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid floor name with default value', () => {
      const result = FloorNameStub();

      expect(result).toBe('CARTOGRAPHY');
    });

    it('VALID: {value: "FORGE"} => creates floor name with custom value', () => {
      const result = FloorNameStub({ value: 'FORGE' });

      expect(result).toBe('FORGE');
    });
  });
});
