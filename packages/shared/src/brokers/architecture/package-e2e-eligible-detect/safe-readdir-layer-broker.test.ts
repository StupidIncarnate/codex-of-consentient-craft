import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

describe('safeReaddirLayerBroker', () => {
  it('VALID: {dirPath: existing dir} => returns entries', () => {
    const proxy = safeReaddirLayerBrokerProxy();
    const dirPath = AbsoluteFilePathStub({ value: '/project/src' });
    proxy.setupDirectory({ dirPath, entries: [] });

    const result = safeReaddirLayerBroker({ dirPath });

    expect(result).toStrictEqual([]);
  });

  it('ERROR: {dirPath: non-existent dir} => returns empty array', () => {
    const proxy = safeReaddirLayerBrokerProxy();
    const dirPath = AbsoluteFilePathStub({ value: '/project/missing' });
    proxy.setupError({ dirPath, error: new Error('ENOENT') });

    const result = safeReaddirLayerBroker({ dirPath });

    expect(result).toStrictEqual([]);
  });
});
