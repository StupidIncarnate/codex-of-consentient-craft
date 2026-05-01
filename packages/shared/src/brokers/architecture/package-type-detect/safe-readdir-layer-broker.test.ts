import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

describe('safeReaddirLayerBroker', () => {
  it('VALID: {dirPath: existing dir} => returns entries', () => {
    const proxy = safeReaddirLayerBrokerProxy();
    proxy.setupDirectory({ entries: [] });

    const result = safeReaddirLayerBroker({
      dirPath: AbsoluteFilePathStub({ value: '/project/src' }),
    });

    expect(result).toStrictEqual([]);
  });

  it('ERROR: {dirPath: non-existent dir} => returns empty array', () => {
    const proxy = safeReaddirLayerBrokerProxy();
    proxy.setupError({ error: new Error('ENOENT') });

    const result = safeReaddirLayerBroker({
      dirPath: AbsoluteFilePathStub({ value: '/project/missing' }),
    });

    expect(result).toStrictEqual([]);
  });
});
