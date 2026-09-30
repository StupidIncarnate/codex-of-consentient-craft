import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';

describe('safeReaddirLayerBroker', () => {
  it('VALID: {readdir succeeds with default empty} => returns empty array', () => {
    const proxy = safeReaddirLayerBrokerProxy();
    const dirPath = '/some/dir';
    proxy.setupReaddirReturns({ dirPath, entries: [] });

    const result = safeReaddirLayerBroker({ dirPath });

    expect(result).toStrictEqual([]);
  });

  it('EMPTY: {readdir throws ENOENT} => returns empty array (swallowed)', () => {
    const proxy = safeReaddirLayerBrokerProxy();
    const dirPath = '/missing/dir';
    proxy.setupReaddirThrows({ dirPath, error: FileMissingErrorStub({ path: dirPath }) });

    const result = safeReaddirLayerBroker({ dirPath });

    expect(result).toStrictEqual([]);
  });
});
