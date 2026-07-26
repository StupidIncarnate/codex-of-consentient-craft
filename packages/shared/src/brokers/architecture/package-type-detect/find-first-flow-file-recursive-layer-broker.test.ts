import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { findFirstFlowFileRecursiveLayerBrokerProxy } from './find-first-flow-file-recursive-layer-broker.proxy';
import { findFirstFlowFileRecursiveLayerBroker } from './find-first-flow-file-recursive-layer-broker';

describe('findFirstFlowFileRecursiveLayerBroker', () => {
  it('VALID: {flows dir with quest-flow.ts at top level} => returns absolute path', () => {
    const proxy = findFirstFlowFileRecursiveLayerBrokerProxy();
    const dirPath = AbsoluteFilePathStub({ value: '/project/src/flows' });
    proxy.setupFlat({ dirPath, fileNames: ['quest-flow.ts', 'other.ts'] });

    const result = findFirstFlowFileRecursiveLayerBroker({ dirPath });

    expect(result).toBe(AbsoluteFilePathStub({ value: '/project/src/flows/quest-flow.ts' }));
  });

  it('VALID: {flows dir with flow nested in subdir} => returns absolute path', () => {
    const proxy = findFirstFlowFileRecursiveLayerBrokerProxy();
    proxy.setupNested({ subDirName: 'quest', fileNames: ['quest-flow.ts'] });

    const result = findFirstFlowFileRecursiveLayerBroker({
      dirPath: AbsoluteFilePathStub({ value: '/project/src/flows' }),
    });

    expect(result).toBe(AbsoluteFilePathStub({ value: '/project/src/flows/quest/quest-flow.ts' }));
  });

  it('EMPTY: {empty flows dir} => returns undefined', () => {
    const proxy = findFirstFlowFileRecursiveLayerBrokerProxy();
    const dirPath = AbsoluteFilePathStub({ value: '/project/src/flows' });
    proxy.setupEmpty({ dirPath });

    const result = findFirstFlowFileRecursiveLayerBroker({ dirPath });

    expect(result).toBe(undefined);
  });

  it('INVALID: {flows dir with no flow files} => returns undefined', () => {
    const proxy = findFirstFlowFileRecursiveLayerBrokerProxy();
    const dirPath = AbsoluteFilePathStub({ value: '/project/src/flows' });
    proxy.setupFlat({ dirPath, fileNames: ['my-broker.ts', 'helper.ts'] });

    const result = findFirstFlowFileRecursiveLayerBroker({ dirPath });

    expect(result).toBe(undefined);
  });
});
