import { isSafePathSegmentGuard } from './is-safe-path-segment-guard';

describe('isSafePathSegmentGuard', () => {
  describe('values that name one child directory', () => {
    it('VALID: {segment: a uuid} => returns true', () => {
      expect(isSafePathSegmentGuard({ segment: '9d3f1c2a-4b5e-4f6a-8c7d-0e1f2a3b4c5d' })).toBe(
        true,
      );
    });

    it('VALID: {segment: a legacy NNN-name folder} => returns true', () => {
      expect(isSafePathSegmentGuard({ segment: '001-add-auth' })).toBe(true);
    });

    it('EDGE: {segment: "..foo"} => returns true', () => {
      // Leading dots are only special when they are the WHOLE name. `..foo` is an ordinary
      // filename, and rejecting it would push a legitimate id onto the slow path forever.
      expect(isSafePathSegmentGuard({ segment: '..foo' })).toBe(true);
    });
  });

  describe('values that reach outside the directory', () => {
    it('INVALID: {segment: ".."} => returns false', () => {
      expect(isSafePathSegmentGuard({ segment: '..' })).toBe(false);
    });

    it('INVALID: {segment: "."} => returns false', () => {
      expect(isSafePathSegmentGuard({ segment: '.' })).toBe(false);
    });

    it('INVALID: {segment: "../../etc/passwd"} => returns false', () => {
      expect(isSafePathSegmentGuard({ segment: '../../etc/passwd' })).toBe(false);
    });

    it('INVALID: {segment: contains a backslash} => returns false', () => {
      expect(isSafePathSegmentGuard({ segment: '..\\..\\windows' })).toBe(false);
    });

    it('INVALID: {segment: contains a forward slash} => returns false', () => {
      expect(isSafePathSegmentGuard({ segment: 'nested/id' })).toBe(false);
    });

    it('INVALID: {segment: contains a NUL byte} => returns false', () => {
      // Built with fromCharCode rather than typed inline: a raw NUL in a source file is
      // invisible in every diff and editor that would otherwise catch it.
      const nul = String.fromCharCode(0);

      expect(isSafePathSegmentGuard({ segment: `id${nul}.json` })).toBe(false);
    });
  });

  describe('absent input', () => {
    it('EMPTY: {segment: empty string} => returns false', () => {
      expect(isSafePathSegmentGuard({ segment: '' })).toBe(false);
    });

    it('EMPTY: {no segment} => returns false', () => {
      expect(isSafePathSegmentGuard({})).toBe(false);
    });
  });
});
