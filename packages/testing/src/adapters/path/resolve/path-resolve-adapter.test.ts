import { resolve } from 'path';
import { pathResolveAdapter } from './path-resolve-adapter';
import { pathResolveAdapterProxy } from './path-resolve-adapter.proxy';

describe('pathResolveAdapter', () => {
  describe('valid paths', () => {
    it('VALID: {paths: ["src", "test.ts"]} => returns absolute path', () => {
      pathResolveAdapterProxy();

      const result = pathResolveAdapter({ paths: ['src', 'test.ts'] });

      expect(result).toBe(resolve('src', 'test.ts'));
    });

    it('VALID: {paths: ["/tmp", "dir", "file.txt"]} => returns absolute path', () => {
      pathResolveAdapterProxy();

      const result = pathResolveAdapter({ paths: ['/tmp', 'dir', 'file.txt'] });

      expect(result).toBe('/tmp/dir/file.txt');
    });

    it('VALID: {paths: ["."]} => returns current directory absolute path', () => {
      pathResolveAdapterProxy();

      const result = pathResolveAdapter({ paths: ['.'] });

      expect(result).toBe(resolve('.'));
    });
  });

  describe('edge cases', () => {
    it('EDGE: {paths: []} => returns current directory', () => {
      pathResolveAdapterProxy();

      const result = pathResolveAdapter({ paths: [] });

      expect(result).toBe(resolve());
    });

    it('EDGE: {paths: ["/absolute"]} => returns absolute path unchanged', () => {
      pathResolveAdapterProxy();

      const result = pathResolveAdapter({ paths: ['/absolute'] });

      expect(result).toBe('/absolute');
    });
  });
});
