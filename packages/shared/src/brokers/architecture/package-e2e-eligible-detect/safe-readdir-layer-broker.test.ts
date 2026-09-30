import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

describe('safeReaddirLayerBroker', () => {
  it('VALID: {dirPath: existing dir} => returns entries', () => {
    const proxy = safeReaddirLayerBrokerProxy();
    const dirPath = '/project/src';
    proxy.setupDirectory({ dirPath, entries: [] });

    const result = safeReaddirLayerBroker({ dirPath });

    expect(result).toStrictEqual([]);
  });

  it('ERROR: {dirPath: non-existent dir} => returns empty array', () => {
    const proxy = safeReaddirLayerBrokerProxy();
    const dirPath = '/project/missing';
    proxy.setupError({ dirPath, error: FileMissingErrorStub({ path: dirPath }) });

    const result = safeReaddirLayerBroker({ dirPath });

    expect(result).toStrictEqual([]);
  });
});
