import { floorGroupKeyContract } from './floor-group-key-contract';
import { FloorGroupKeyStub } from './floor-group-key.stub';

describe('floorGroupKeyContract', () => {
  describe('valid keys', () => {
    it('VALID: {value: "0:FORGE"} => parses depth-floor key', () => {
      const result = floorGroupKeyContract.parse(FloorGroupKeyStub({ value: '0:FORGE' }));

      expect(result).toBe('0:FORGE');
    });
  });

  describe('invalid keys', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => floorGroupKeyContract.parse('')).toThrow(/too_small/u);
    });
  });
});
