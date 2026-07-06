import { webBundleDistPathAdapter } from './web-bundle-dist-path-adapter';
import { webBundleDistPathAdapterProxy } from './web-bundle-dist-path-adapter.proxy';

describe('webBundleDistPathAdapter', () => {
  it('VALID: {@dungeonmaster/web installed, dist present} => returns path ending with web/dist', () => {
    const proxy = webBundleDistPathAdapterProxy();
    proxy.bundleExists();

    const result = webBundleDistPathAdapter();

    expect(result).toMatch(/^\/[^\s]+\/web\/dist$/u);
  });

  it('VALID: {dist directory missing} => returns null', () => {
    const proxy = webBundleDistPathAdapterProxy();
    proxy.bundleMissing();

    const result = webBundleDistPathAdapter();

    expect(result).toBe(null);
  });
});
