import { pathRelativeAdapter } from './path-relative-adapter';
import { pathRelativeAdapterProxy } from './path-relative-adapter.proxy';
import { FilePathStub, PathSegmentStub } from '@dungeonmaster/shared/contracts';

describe('pathRelativeAdapter', () => {
  describe('real passthrough', () => {
    it('VALID: {from: sibling packages} => returns the ../ relative path between them', () => {
      pathRelativeAdapterProxy();

      const result = pathRelativeAdapter({
        from: FilePathStub({ value: '/repo/packages/app' }),
        to: FilePathStub({ value: '/repo/packages/@gateway/npm' }),
      });

      expect(result).toBe('../@gateway/npm');
    });

    it('VALID: {from: repo root, to: nested gateway package} => returns the path with no leading ./', () => {
      pathRelativeAdapterProxy();

      const result = pathRelativeAdapter({
        from: FilePathStub({ value: '/repo' }),
        to: FilePathStub({ value: '/repo/packages/@gateway/npm' }),
      });

      expect(result).toBe('packages/@gateway/npm');
    });

    it('EDGE: {from: to: same directory} => returns the empty string', () => {
      pathRelativeAdapterProxy();

      const result = pathRelativeAdapter({
        from: FilePathStub({ value: '/repo/packages/app' }),
        to: FilePathStub({ value: '/repo/packages/app' }),
      });

      expect(result).toBe('');
    });
  });

  describe('staged resolutions', () => {
    it('VALID: {a staged pair} => returns the staged result instead of the real computation', () => {
      const proxy = pathRelativeAdapterProxy();
      proxy.returns({
        from: FilePathStub({ value: '/repo/packages/app' }),
        to: FilePathStub({ value: '/repo/packages/@gateway/npm' }),
        result: PathSegmentStub({ value: 'staged-result' }),
      });

      const result = pathRelativeAdapter({
        from: FilePathStub({ value: '/repo/packages/app' }),
        to: FilePathStub({ value: '/repo/packages/@gateway/npm' }),
      });

      expect(result).toBe('staged-result');
    });
  });
});
