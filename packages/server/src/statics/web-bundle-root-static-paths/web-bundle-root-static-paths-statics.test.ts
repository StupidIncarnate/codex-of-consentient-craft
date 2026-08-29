import { webBundleRootStaticPathsStatics } from './web-bundle-root-static-paths-statics';

describe('webBundleRootStaticPathsStatics', () => {
  // Each entry is compared against a request pathname, so the leading slash is load-bearing: an
  // entry written 'favicon.svg' matches nothing and falls back to the SPA index, which is the exact
  // bug this list exists to fix. Pinning the literal is what holds that.
  it('VALID: exported value => matches expected shape', () => {
    expect(webBundleRootStaticPathsStatics).toStrictEqual({
      paths: ['/favicon.svg'],
    });
  });
});
