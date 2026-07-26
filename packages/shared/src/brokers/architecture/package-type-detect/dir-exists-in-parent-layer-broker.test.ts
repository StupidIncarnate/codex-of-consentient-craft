import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { dirExistsInParentLayerBrokerProxy } from './dir-exists-in-parent-layer-broker.proxy';
import { dirExistsInParentLayerBroker } from './dir-exists-in-parent-layer-broker';

describe('dirExistsInParentLayerBroker', () => {
  it('VALID: {parent with target dir} => returns true', () => {
    const proxy = dirExistsInParentLayerBrokerProxy();
    const parentDirPath = AbsoluteFilePathStub({ value: '/project/src/responders' });
    proxy.setupWithDir({ parentDirPath, dirName: 'hook' });

    const result = dirExistsInParentLayerBroker({ parentDirPath, dirName: 'hook' });

    expect(result).toBe(true);
  });

  it('INVALID: {parent without target dir} => returns false', () => {
    const proxy = dirExistsInParentLayerBrokerProxy();
    const parentDirPath = AbsoluteFilePathStub({ value: '/project/src/responders' });
    proxy.setupWithDir({ parentDirPath, dirName: 'list' });

    const result = dirExistsInParentLayerBroker({ parentDirPath, dirName: 'hook' });

    expect(result).toBe(false);
  });

  it('EMPTY: {empty parent dir} => returns false', () => {
    const proxy = dirExistsInParentLayerBrokerProxy();
    const parentDirPath = AbsoluteFilePathStub({ value: '/project/src/responders' });
    proxy.setupEmpty({ parentDirPath });

    const result = dirExistsInParentLayerBroker({ parentDirPath, dirName: 'hook' });

    expect(result).toBe(false);
  });
});
