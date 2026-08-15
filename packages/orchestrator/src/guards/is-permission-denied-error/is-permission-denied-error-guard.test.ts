import { permissionDeniedErrorStatics } from '../../statics/permission-denied-error/permission-denied-error-statics';
import { isPermissionDeniedErrorGuard } from './is-permission-denied-error-guard';

describe('isPermissionDeniedErrorGuard', () => {
  describe('permission markers in an Error message', () => {
    it.each(permissionDeniedErrorStatics.markers)(
      'VALID: {Error message containing %s} => returns true',
      (marker) => {
        expect(
          isPermissionDeniedErrorGuard({ error: new Error(`git: ${marker} while writing`) }),
        ).toBe(true);
      },
    );

    it.each(permissionDeniedErrorStatics.markers)(
      'VALID: {Error message containing %s upper-cased} => returns true',
      (marker) => {
        expect(
          isPermissionDeniedErrorGuard({ error: new Error(`git: ${marker.toUpperCase()} here`) }),
        ).toBe(true);
      },
    );

    it.each(permissionDeniedErrorStatics.markers)(
      'VALID: {Error message containing %s lower-cased} => returns true',
      (marker) => {
        expect(
          isPermissionDeniedErrorGuard({ error: new Error(`git: ${marker.toLowerCase()} here`) }),
        ).toBe(true);
      },
    );
  });

  describe('permission markers on the errno code', () => {
    it('VALID: {fs rejection carrying code EACCES and an unrelated message} => returns true', () => {
      const error = Object.assign(new Error('mkdir failed'), { code: 'EACCES' });

      expect(isPermissionDeniedErrorGuard({ error })).toBe(true);
    });

    it('VALID: {fs rejection carrying code EPERM and an unrelated message} => returns true', () => {
      const error = Object.assign(new Error('symlink failed'), { code: 'EPERM' });

      expect(isPermissionDeniedErrorGuard({ error })).toBe(true);
    });

    it('VALID: {plain object carrying code EACCES} => returns true', () => {
      expect(isPermissionDeniedErrorGuard({ error: { code: 'EACCES' } })).toBe(true);
    });
  });

  describe('permission markers in a raw string', () => {
    it('VALID: {verbatim npm stderr string} => returns true', () => {
      const error = 'npm error code EACCES\nnpm error syscall mkdir\nnpm error errno -13';

      expect(isPermissionDeniedErrorGuard({ error })).toBe(true);
    });

    it('VALID: {verbatim POSIX rename failure string} => returns true', () => {
      const error = "rename '/repo/a' -> '/repo/b': Operation not permitted";

      expect(isPermissionDeniedErrorGuard({ error })).toBe(true);
    });
  });

  describe('non-permission failures', () => {
    it('VALID: {build failure Error} => returns false', () => {
      expect(isPermissionDeniedErrorGuard({ error: new Error('tsc exited with code 2') })).toBe(
        false,
      );
    });

    it('VALID: {ENOENT fs rejection} => returns false', () => {
      const error = Object.assign(new Error('ENOENT: no such file or directory'), {
        code: 'ENOENT',
      });

      expect(isPermissionDeniedErrorGuard({ error })).toBe(false);
    });

    it('EDGE: {git name-taken stderr string} => returns false', () => {
      const error = "fatal: 'quest/add-auth-7bc217a1' already exists";

      expect(isPermissionDeniedErrorGuard({ error })).toBe(false);
    });

    it('EMPTY: {error: ""} => returns false', () => {
      expect(isPermissionDeniedErrorGuard({ error: '' })).toBe(false);
    });

    it('EMPTY: {error: null} => returns false', () => {
      expect(isPermissionDeniedErrorGuard({ error: null })).toBe(false);
    });

    it('EMPTY: {error omitted} => returns false', () => {
      expect(isPermissionDeniedErrorGuard({})).toBe(false);
    });
  });
});
