import { isAbsolutePathGuard } from './is-absolute-path-guard';

describe('isAbsolutePathGuard', () => {
  describe('absolute paths', () => {
    it('VALID: {path: "/tmp/dm-home"} => returns true', () => {
      expect(isAbsolutePathGuard({ path: '/tmp/dm-home' })).toBe(true);
    });

    it('VALID: {path: "C:\\\\dm-home"} => returns true', () => {
      expect(isAbsolutePathGuard({ path: 'C:\\dm-home' })).toBe(true);
    });
  });

  describe('non-absolute paths', () => {
    it('INVALID: {path: "relative/dm-home"} => returns false', () => {
      expect(isAbsolutePathGuard({ path: 'relative/dm-home' })).toBe(false);
    });

    it('INVALID: {path: "../dm-home"} => returns false', () => {
      expect(isAbsolutePathGuard({ path: '../dm-home' })).toBe(false);
    });

    it('EMPTY: {path: ""} => returns false', () => {
      expect(isAbsolutePathGuard({ path: '' })).toBe(false);
    });

    it('EMPTY: {} => returns false', () => {
      expect(isAbsolutePathGuard({})).toBe(false);
    });
  });
});
