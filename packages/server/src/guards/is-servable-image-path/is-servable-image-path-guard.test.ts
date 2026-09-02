import { isServableImagePathGuard } from './is-servable-image-path-guard';
import { imageServeStatics } from '../../statics/image-serve/image-serve-statics';

describe('isServableImagePathGuard', () => {
  describe('traversal segment', () => {
    it('INVALID: {path: "/a/../../../../etc/passwd"} => returns false', () => {
      const result = isServableImagePathGuard({ path: '/a/../../../../etc/passwd' });

      expect(result).toBe(false);
    });
  });

  describe('embedded NUL byte', () => {
    it('INVALID: {path: "/tmp/img<NUL>.png"} => returns false', () => {
      const result = isServableImagePathGuard({
        path: `/tmp/img${String.fromCharCode(0)}.png`,
      });

      expect(result).toBe(false);
    });
  });

  describe('embedded newline', () => {
    it('INVALID: {path: "/tmp/img\\n.png"} => returns false', () => {
      const result = isServableImagePathGuard({ path: '/tmp/img\n.png' });

      expect(result).toBe(false);
    });
  });

  describe('embedded carriage return', () => {
    it('INVALID: {path: "/tmp/img\\r.png"} => returns false', () => {
      const result = isServableImagePathGuard({ path: '/tmp/img\r.png' });

      expect(result).toBe(false);
    });
  });

  describe('relative path', () => {
    it('INVALID: {path: "relative/img.png"} => returns false', () => {
      const result = isServableImagePathGuard({ path: 'relative/img.png' });

      expect(result).toBe(false);
    });
  });

  describe('empty path', () => {
    it('EMPTY: {path: ""} => returns false', () => {
      const result = isServableImagePathGuard({ path: '' });

      expect(result).toBe(false);
    });
  });

  describe('over the length cap', () => {
    it('EDGE: {path: one over maxPathLength} => returns false', () => {
      const path = `/${'a'.repeat(imageServeStatics.maxPathLength)}`;

      const result = isServableImagePathGuard({ path });

      expect(result).toBe(false);
    });
  });

  describe('dots inside a filename', () => {
    it('VALID: {path: "/tmp/quest/images/a..b.png"} => returns true', () => {
      const result = isServableImagePathGuard({ path: '/tmp/quest/images/a..b.png' });

      expect(result).toBe(true);
    });
  });

  describe('ordinary absolute path', () => {
    it('VALID: {path: "/tmp/quest/images/abc.png"} => returns true', () => {
      const result = isServableImagePathGuard({ path: '/tmp/quest/images/abc.png' });

      expect(result).toBe(true);
    });
  });

  describe('exactly at the length cap', () => {
    it('EDGE: {path: exactly maxPathLength} => returns true', () => {
      const path = `/${'a'.repeat(imageServeStatics.maxPathLength - 1)}`;

      const result = isServableImagePathGuard({ path });

      expect(result).toBe(true);
    });
  });
});
