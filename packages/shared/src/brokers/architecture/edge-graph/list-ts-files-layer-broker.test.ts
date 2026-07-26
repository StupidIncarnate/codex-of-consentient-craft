import { listTsFilesLayerBroker } from './list-ts-files-layer-broker';
import { listTsFilesLayerBrokerProxy } from './list-ts-files-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('listTsFilesLayerBroker', () => {
  it('VALID: {directory with .ts files} => returns all ts file paths', () => {
    const proxy = listTsFilesLayerBrokerProxy();
    const dirPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src/flows/quest' });
    const questFlowPath = AbsoluteFilePathStub({
      value: '/repo/packages/server/src/flows/quest/quest-flow.ts',
    });

    proxy.setupFlatDirectory({ dirPath, filePaths: [questFlowPath] });

    const result = listTsFilesLayerBroker({ dirPath });

    expect(result).toStrictEqual([questFlowPath]);
  });

  it('VALID: {test files in directory} => filters out test/proxy/stub files', () => {
    const proxy = listTsFilesLayerBrokerProxy();
    const dirPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src/flows/quest' });
    const testFilePath = AbsoluteFilePathStub({
      value: '/repo/packages/server/src/flows/quest/quest-flow.test.ts',
    });

    proxy.setupFlatDirectory({ dirPath, filePaths: [testFilePath] });

    const result = listTsFilesLayerBroker({ dirPath });

    expect(result).toStrictEqual([]);
  });

  it('EMPTY: {empty directory} => returns empty array', () => {
    const proxy = listTsFilesLayerBrokerProxy();
    const dirPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src/flows' });

    proxy.setupEmpty({ dirPath });

    const result = listTsFilesLayerBroker({ dirPath });

    expect(result).toStrictEqual([]);
  });
});
