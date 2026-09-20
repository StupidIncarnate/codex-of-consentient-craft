import { snapshotBoundaryContract } from './snapshot-boundary-contract';
import { SnapshotBoundaryStub } from './snapshot-boundary.stub';

describe('snapshotBoundaryContract', () => {
  describe('valid boundaries', () => {
    it('VALID: {value: "start"} => returns "start"', () => {
      expect(SnapshotBoundaryStub({ value: 'start' })).toBe('start');
    });

    it('VALID: {value: "end"} => returns "end"', () => {
      expect(SnapshotBoundaryStub({ value: 'end' })).toBe('end');
    });
  });

  describe('invalid boundaries', () => {
    it('INVALID: {value: "middle"} => throws, because a run has exactly two boundaries', () => {
      expect(() => snapshotBoundaryContract.parse('middle')).toThrow(/invalid_enum_value/u);
    });

    it('EMPTY: {value: ""} => throws an invalid-enum error', () => {
      expect(() => snapshotBoundaryContract.parse('')).toThrow(/invalid_enum_value/u);
    });
  });
});
