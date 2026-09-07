import { bundleInputsTransformer } from './bundle-inputs-transformer';
import { bundleStatics } from '../../statics/bundle/bundle-statics';

describe('bundleInputsTransformer', () => {
  describe('the package the bundle is built for', () => {
    it('VALID: {isBundledPackage: true} => returns the closure globs followed by the bundler globs', () => {
      const result = bundleInputsTransformer({ isBundledPackage: true });

      expect(result).toStrictEqual([
        'src/**',
        '*.ts',
        'package.json',
        'tsconfig*.json',
        'vite.config.ts',
        'index.html',
        'postcss.config.cjs',
        'public/**',
        'web-worker-stub.mjs',
      ]);
    });
  });

  describe('a package the dependency walk reached', () => {
    it('VALID: {isBundledPackage: false} => returns the closure globs only', () => {
      const result = bundleInputsTransformer({ isBundledPackage: false });

      expect(result).toStrictEqual(['src/**', '*.ts', 'package.json', 'tsconfig*.json']);
    });

    // A library has no vite config and no HTML shell, so globbing for them costs a walk that can
    // only ever match nothing. More to the point, a package that DOES happen to carry an
    // index.html for unrelated reasons must not have it folded into somebody else's bundle hash.
    it('VALID: {isBundledPackage: false} => omits every bundler-owned glob', () => {
      const result = bundleInputsTransformer({ isBundledPackage: false });
      const bundlerOwned = result.filter((pattern) =>
        bundleStatics.uiPatterns.some((uiPattern) => String(pattern) === uiPattern),
      );

      expect(bundlerOwned).toStrictEqual([]);
    });
  });

  describe('branding', () => {
    it('VALID: {isBundledPackage: true} => every entry parses as a GlobPattern', () => {
      const result = bundleInputsTransformer({ isBundledPackage: true });

      expect(result.map((pattern) => typeof pattern)).toStrictEqual([
        'string',
        'string',
        'string',
        'string',
        'string',
        'string',
        'string',
        'string',
        'string',
      ]);
    });
  });
});
