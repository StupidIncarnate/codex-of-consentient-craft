import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';

describe('safeReaddirLayerBroker', () => {
  it('VALID: {existing directory} => returns directory entries', () => {
    const proxy = safeReaddirLayerBrokerProxy();
    const dirPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src/flows' });

    const dirents = proxy.setupDirectory({
      dirPath,
      entries: [],
    });

    const result = safeReaddirLayerBroker({ dirPath });

    expect(result).toStrictEqual(dirents);
  });

  it('ERROR: {missing directory} => returns empty array instead of throwing', () => {
    const proxy = safeReaddirLayerBrokerProxy();
    const dirPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src/flows/missing' });

    proxy.setupError({ dirPath, error: FileMissingErrorStub({ path: dirPath }) });

    const result = safeReaddirLayerBroker({ dirPath });

    expect(result).toStrictEqual([]);
  });
});
