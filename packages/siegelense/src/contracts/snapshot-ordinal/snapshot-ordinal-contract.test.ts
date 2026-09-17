import { snapshotOrdinalContract } from './snapshot-ordinal-contract';
import { SnapshotOrdinalStub } from './snapshot-ordinal.stub';

describe('snapshotOrdinalContract', () => {
  describe('valid ordinals', () => {
    it('EDGE: {value: 1} => returns 1 at the first-payload boundary', () => {
      expect(SnapshotOrdinalStub({ value: 1 })).toBe(1);
    });

    it('VALID: {value: 12} => returns 12', () => {
      expect(SnapshotOrdinalStub({ value: 12 })).toBe(12);
    });
  });

  describe('invalid ordinals', () => {
    it('EDGE: {value: 0} => throws, because payload directories count from 1', () => {
      expect(() => snapshotOrdinalContract.parse(0)).toThrow(/too_small/u);
    });

    it('INVALID: {value: -1} => throws a too-small validation error', () => {
      expect(() => snapshotOrdinalContract.parse(-1)).toThrow(/too_small/u);
    });

    it('INVALID: {value: 1.5} => throws, because a directory number is an integer', () => {
      expect(() => snapshotOrdinalContract.parse(1.5)).toThrow(/integer/u);
    });
  });
});
