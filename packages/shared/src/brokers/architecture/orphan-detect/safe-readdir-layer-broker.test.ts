import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('safeReaddirLayerBroker', () => {
  it('VALID: {readdir succeeds with default empty} => returns empty array', () => {
    safeReaddirLayerBrokerProxy();
    const dirPath = AbsoluteFilePathStub({ value: '/some/dir' });

    const result = safeReaddirLayerBroker({ dirPath });

    expect(result).toStrictEqual([]);
  });

  it('EMPTY: {readdir throws ENOENT} => returns empty array (swallowed)', () => {
    const proxy = safeReaddirLayerBrokerProxy();
    proxy.setupReaddirThrows({ error: new Error('ENOENT') });
    const dirPath = AbsoluteFilePathStub({ value: '/missing/dir' });

    const result = safeReaddirLayerBroker({ dirPath });

    expect(result).toStrictEqual([]);
  });
});
