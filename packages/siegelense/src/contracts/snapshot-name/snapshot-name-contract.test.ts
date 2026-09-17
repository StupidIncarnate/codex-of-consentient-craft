import { snapshotNameContract } from './snapshot-name-contract';
import { SnapshotNameStub } from './snapshot-name.stub';
import { snapshotStatics } from '../../statics/snapshot/snapshot-statics';

describe('snapshotNameContract', () => {
  describe('valid names', () => {
    it('VALID: {value: "clean"} => returns "clean"', () => {
      expect(SnapshotNameStub({ value: 'clean' })).toBe('clean');
    });

    it('VALID: {value: "after-cycle-1"} => returns "after-cycle-1"', () => {
      expect(SnapshotNameStub({ value: 'after-cycle-1' })).toBe('after-cycle-1');
    });

    it('VALID: {value: "run_4:start"} => returns "run_4:start", so the automatic pair is representable', () => {
      expect(SnapshotNameStub({ value: 'run_4:start' })).toBe('run_4:start');
    });

    it('VALID: {value: "v1.2"} => returns "v1.2"', () => {
      expect(SnapshotNameStub({ value: 'v1.2' })).toBe('v1.2');
    });

    it('EDGE: {value: 64 characters} => returns the whole name at the length cap', () => {
      const atCap = 'a'.repeat(snapshotStatics.limits.maxNameLength);

      expect(SnapshotNameStub({ value: atCap })).toBe(atCap);
    });
  });

  describe('invalid names', () => {
    it('EMPTY: {value: ""} => throws a too-small validation error', () => {
      expect(() => snapshotNameContract.parse('')).toThrow(/too_small/u);
    });

    it('INVALID: {value: "after cycle"} => throws, because a space is not in the character class', () => {
      expect(() => snapshotNameContract.parse('after cycle')).toThrow(/invalid_string/u);
    });

    it('INVALID: {value: "a/b"} => throws, so a name can never reach out of the store directory', () => {
      expect(() => snapshotNameContract.parse('a/b')).toThrow(/invalid_string/u);
    });

    it('INVALID: {value: ".."} => throws, so a name can never climb out of the store directory', () => {
      expect(() => snapshotNameContract.parse('../escape')).toThrow(/invalid_string/u);
    });

    it('EDGE: {value: 65 characters} => throws a too-big validation error', () => {
      expect(() =>
        snapshotNameContract.parse('a'.repeat(snapshotStatics.limits.maxNameLength + 1)),
      ).toThrow(/too_big/u);
    });
  });
});
