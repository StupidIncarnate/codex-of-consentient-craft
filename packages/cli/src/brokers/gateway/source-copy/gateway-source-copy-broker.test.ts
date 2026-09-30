import { gatewaySourceCopyBroker } from './gateway-source-copy-broker';
import { gatewaySourceCopyBrokerProxy } from './gateway-source-copy-broker.proxy';

describe('gatewaySourceCopyBroker', () => {
  it('VALID: {folder: node} => copies the installed node gateway src into the package root', async () => {
    const proxy = gatewaySourceCopyBrokerProxy();
    const packageRoot = '/consumer/packages/@gateway/node';
    proxy.copySucceeds({ folder: 'node', packageRoot });

    const result = await gatewaySourceCopyBroker({ folder: 'node', packageRoot });

    expect(result).toStrictEqual(['/consumer/packages/@gateway/node/src']);
    expect(proxy.copiedSources()).toStrictEqual([
      expect.stringMatching(/^\/.+\/packages\/@gateway\/node\/src$/u),
    ]);
  });

  it('VALID: {folder: browser} => copies src only, since the jsdom polyfill is a @dungeonmaster/testing import now', async () => {
    const proxy = gatewaySourceCopyBrokerProxy();
    const packageRoot = '/consumer/packages/@gateway/browser';
    proxy.copySucceeds({ folder: 'browser', packageRoot });

    const result = await gatewaySourceCopyBroker({ folder: 'browser', packageRoot });

    expect(result).toStrictEqual(['/consumer/packages/@gateway/browser/src']);
  });
});
