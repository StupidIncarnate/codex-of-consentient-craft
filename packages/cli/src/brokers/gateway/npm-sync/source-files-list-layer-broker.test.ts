import { sourceFilesListLayerBroker } from './source-files-list-layer-broker';
import { sourceFilesListLayerBrokerProxy } from './source-files-list-layer-broker.proxy';

describe('sourceFilesListLayerBroker', () => {
  it('VALID: {nested directories} => returns every file at every depth', async () => {
    const proxy = sourceFilesListLayerBrokerProxy();
    proxy.setupTree({
      dirPath: '/own/src/elkjs',
      relativeFilePaths: [
        'elkjs.ts',
        'elkjs.test.ts',
        'elk-layout-result/elk-layout-result.stub.ts',
      ],
    });

    const result = await sourceFilesListLayerBroker({ dirPath: '/own/src/elkjs' });

    expect(result).toStrictEqual([
      '/own/src/elkjs/elkjs.ts',
      '/own/src/elkjs/elkjs.test.ts',
      '/own/src/elkjs/elk-layout-result/elk-layout-result.stub.ts',
    ]);
  });

  it('EDGE: {a symlink entry} => leaves it out', async () => {
    const proxy = sourceFilesListLayerBrokerProxy();
    proxy.setupEntries({
      dirPath: '/own/src/zod',
      entries: [
        { name: 'zod.ts', kind: 'file' },
        { name: 'linked', kind: 'symlink' },
      ],
    });

    const result = await sourceFilesListLayerBroker({ dirPath: '/own/src/zod' });

    expect(result).toStrictEqual(['/own/src/zod/zod.ts']);
  });

  it('EMPTY: {empty directory} => returns []', async () => {
    const proxy = sourceFilesListLayerBrokerProxy();
    proxy.setupEntries({ dirPath: '/own/src/empty', entries: [] });

    const result = await sourceFilesListLayerBroker({ dirPath: '/own/src/empty' });

    expect(result).toStrictEqual([]);
  });
});
