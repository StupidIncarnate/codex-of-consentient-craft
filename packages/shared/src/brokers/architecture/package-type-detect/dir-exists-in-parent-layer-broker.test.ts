import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { dirExistsInParentLayerBrokerProxy } from './dir-exists-in-parent-layer-broker.proxy';
import { dirExistsInParentLayerBroker } from './dir-exists-in-parent-layer-broker';

describe('dirExistsInParentLayerBroker', () => {
  it('VALID: {parent with target dir} => returns true', () => {
    const proxy = dirExistsInParentLayerBrokerProxy();
    proxy.setupWithDir({ dirName: 'hook' });

    const result = dirExistsInParentLayerBroker({
      parentDirPath: AbsoluteFilePathStub({ value: '/project/src/responders' }),
      dirName: 'hook',
    });

    expect(result).toBe(true);
  });

  it('INVALID: {parent without target dir} => returns false', () => {
    const proxy = dirExistsInParentLayerBrokerProxy();
    proxy.setupWithDir({ dirName: 'list' });

    const result = dirExistsInParentLayerBroker({
      parentDirPath: AbsoluteFilePathStub({ value: '/project/src/responders' }),
      dirName: 'hook',
    });

    expect(result).toBe(false);
  });

  it('EMPTY: {empty parent dir} => returns false', () => {
    const proxy = dirExistsInParentLayerBrokerProxy();
    proxy.setupEmpty();

    const result = dirExistsInParentLayerBroker({
      parentDirPath: AbsoluteFilePathStub({ value: '/project/src/responders' }),
      dirName: 'hook',
    });

    expect(result).toBe(false);
  });
});
