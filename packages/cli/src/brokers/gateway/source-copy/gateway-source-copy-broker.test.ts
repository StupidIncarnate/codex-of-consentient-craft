import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { gatewaySourceCopyBroker } from './gateway-source-copy-broker';
import { gatewaySourceCopyBrokerProxy } from './gateway-source-copy-broker.proxy';

describe('gatewaySourceCopyBroker', () => {
  it('VALID: {folder: node} => copies the installed node gateway src into the package root', async () => {
    const proxy = gatewaySourceCopyBrokerProxy();
    proxy.copySucceeds();

    const result = await gatewaySourceCopyBroker({
      folder: 'node',
      packageRoot: FilePathStub({ value: '/consumer/packages/@gateway/node' }),
    });

    expect(result).toStrictEqual(['/consumer/packages/@gateway/node/src']);
    expect(proxy.copiedSources()).toStrictEqual([
      expect.stringMatching(/^\/.+\/packages\/@gateway\/node\/src$/u),
    ]);
  });

  it('VALID: {folder: browser} => copies src and the jsdom __mocks__', async () => {
    const proxy = gatewaySourceCopyBrokerProxy();
    proxy.copySucceeds();

    const result = await gatewaySourceCopyBroker({
      folder: 'browser',
      packageRoot: FilePathStub({ value: '/consumer/packages/@gateway/browser' }),
    });

    expect(result).toStrictEqual([
      '/consumer/packages/@gateway/browser/src',
      '/consumer/packages/@gateway/browser/__mocks__',
    ]);
  });
});
