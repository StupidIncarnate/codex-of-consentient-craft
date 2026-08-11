import { pathResolveAdapter } from './path-resolve-adapter';
import { pathResolveAdapterProxy } from './path-resolve-adapter.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('pathResolveAdapter', () => {
  describe('staged resolutions', () => {
    it('VALID: {paths: ["./packages/web"]} => returns the staged absolute package root', () => {
      const proxy = pathResolveAdapterProxy();
      proxy.returns({
        paths: ['./packages/web'],
        result: AbsoluteFilePathStub({ value: '/repo/packages/web' }),
      });

      const result = pathResolveAdapter({ paths: ['./packages/web'] });

      expect(result).toBe('/repo/packages/web');
    });

    it('VALID: {two distinct relative locations} => each address answers with its own root', () => {
      const proxy = pathResolveAdapterProxy();
      proxy.returns({
        paths: ['./packages/web'],
        result: AbsoluteFilePathStub({ value: '/repo/packages/web' }),
      });
      proxy.returns({
        paths: ['./packages/server'],
        result: AbsoluteFilePathStub({ value: '/repo/packages/server' }),
      });

      const first = pathResolveAdapter({ paths: ['./packages/web'] });
      const second = pathResolveAdapter({ paths: ['./packages/server'] });

      expect([first, second]).toStrictEqual(['/repo/packages/web', '/repo/packages/server']);
    });
  });

  describe('real passthrough', () => {
    it('VALID: {paths: ["/already/absolute"]} => an absolute input passes through unchanged', () => {
      pathResolveAdapterProxy();

      const result = pathResolveAdapter({ paths: ['/already/absolute'] });

      expect(result).toBe('/already/absolute');
    });

    it('VALID: {paths: ["/repo", "./packages/web"]} => the "./" prefix is anchored on the base segment', () => {
      pathResolveAdapterProxy();

      const result = pathResolveAdapter({ paths: ['/repo', './packages/web'] });

      expect(result).toBe('/repo/packages/web');
    });
  });
});
