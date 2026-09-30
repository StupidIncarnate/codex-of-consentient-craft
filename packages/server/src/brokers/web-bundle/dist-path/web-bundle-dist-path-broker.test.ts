
import { webBundleDistPathBroker } from './web-bundle-dist-path-broker';
import { webBundleDistPathBrokerProxy } from './web-bundle-dist-path-broker.proxy';

describe('webBundleDistPathBroker', () => {
  it('VALID: {@dungeonmaster/web installed, dist present} => returns path ending with web/dist', () => {
    const proxy = webBundleDistPathBrokerProxy();
    proxy.bundleExists();

    const result = webBundleDistPathBroker({
      packageName: '@dungeonmaster/web',
    });

    expect(result).toMatch(/^\/[^\s]+\/web\/dist$/u);
  });

  it('VALID: {dist directory missing} => returns null', () => {
    const proxy = webBundleDistPathBrokerProxy();
    proxy.bundleMissing();

    const result = webBundleDistPathBroker({
      packageName: '@dungeonmaster/web',
    });

    expect(result).toBe(null);
  });

  it('EDGE: {package cannot be resolved} => returns null', () => {
    const proxy = webBundleDistPathBrokerProxy();
    proxy.bundleExists();

    const result = webBundleDistPathBroker({
      packageName: '@dungeonmaster/nonexistent-test-package',
    });

    expect(result).toBe(null);
  });
});
