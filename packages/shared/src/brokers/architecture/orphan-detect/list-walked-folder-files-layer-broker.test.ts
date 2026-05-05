import { listWalkedFolderFilesLayerBroker } from './list-walked-folder-files-layer-broker';
import { listWalkedFolderFilesLayerBrokerProxy } from './list-walked-folder-files-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import type { fsReaddirWithTypesAdapter } from '../../../adapters/fs/readdir-with-types/fs-readdir-with-types-adapter';

type Dirent = ReturnType<typeof fsReaddirWithTypesAdapter>[0];

const fileEntry = ({ name }: { name: string }): Dirent =>
  ({
    name,
    parentPath: '/stub',
    path: '/stub',
    isDirectory: () => false,
    isFile: () => true,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }) as Dirent;

const dirEntry = ({ name }: { name: string }): Dirent =>
  ({
    name,
    parentPath: '/stub',
    path: '/stub',
    isDirectory: () => true,
    isFile: () => false,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }) as Dirent;

const throwEnoent = (): never => {
  throw new Error('ENOENT');
};

const dispatchByPath =
  ({ entries }: { entries: ReadonlyMap<string, Dirent[]> }) =>
  (dirPath: string): Dirent[] => {
    const result = entries.get(dirPath);
    return result ?? throwEnoent();
  };

describe('listWalkedFolderFilesLayerBroker', () => {
  it('VALID: {package with files in walked folder types} => returns those files', () => {
    const proxy = listWalkedFolderFilesLayerBrokerProxy();
    const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/sample/src' });
    proxy.implementation({
      fn: dispatchByPath({
        entries: new Map([
          ['/repo/packages/sample/src/startup', [fileEntry({ name: 'start-app.ts' })]],
          ['/repo/packages/sample/src/brokers', [dirEntry({ name: 'foo' })]],
          ['/repo/packages/sample/src/brokers/foo', [fileEntry({ name: 'foo-broker.ts' })]],
          ['/repo/packages/sample/src/widgets', [dirEntry({ name: 'bar' })]],
          ['/repo/packages/sample/src/widgets/bar', [fileEntry({ name: 'bar-widget.tsx' })]],
        ]),
      }),
    });

    const result = listWalkedFolderFilesLayerBroker({ packageSrcPath });

    const sortedDisplay = [...result]
      .map((p) => String(p).slice(`${String(packageSrcPath)}/`.length))
      .sort((a, b) => a.localeCompare(b));

    expect(sortedDisplay).toStrictEqual([
      'brokers/foo/foo-broker.ts',
      'startup/start-app.ts',
      'widgets/bar/bar-widget.tsx',
    ]);
  });

  it('VALID: {test/proxy/stub files alongside implementation} => excludes them from results', () => {
    const proxy = listWalkedFolderFilesLayerBrokerProxy();
    const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/sample/src' });
    proxy.implementation({
      fn: dispatchByPath({
        entries: new Map([
          ['/repo/packages/sample/src/brokers', [dirEntry({ name: 'foo' })]],
          [
            '/repo/packages/sample/src/brokers/foo',
            [
              fileEntry({ name: 'foo-broker.ts' }),
              fileEntry({ name: 'foo-broker.test.ts' }),
              fileEntry({ name: 'foo-broker.proxy.ts' }),
              fileEntry({ name: 'foo.stub.ts' }),
            ],
          ],
        ]),
      }),
    });

    const result = listWalkedFolderFilesLayerBroker({ packageSrcPath });

    const sortedDisplay = [...result]
      .map((p) => String(p).slice(`${String(packageSrcPath)}/`.length))
      .sort((a, b) => a.localeCompare(b));

    expect(sortedDisplay).toStrictEqual(['brokers/foo/foo-broker.ts']);
  });

  it('VALID: {non-.ts/.tsx files in walked dir} => excluded from results', () => {
    const proxy = listWalkedFolderFilesLayerBrokerProxy();
    const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/sample/src' });
    proxy.implementation({
      fn: dispatchByPath({
        entries: new Map([
          ['/repo/packages/sample/src/brokers', [dirEntry({ name: 'foo' })]],
          [
            '/repo/packages/sample/src/brokers/foo',
            [fileEntry({ name: 'foo-broker.ts' }), fileEntry({ name: 'foo-broker.json' })],
          ],
        ]),
      }),
    });

    const result = listWalkedFolderFilesLayerBroker({ packageSrcPath });

    const sortedDisplay = [...result]
      .map((p) => String(p).slice(`${String(packageSrcPath)}/`.length))
      .sort((a, b) => a.localeCompare(b));

    expect(sortedDisplay).toStrictEqual(['brokers/foo/foo-broker.ts']);
  });

  it('EMPTY: {all folders missing on disk} => returns empty array', () => {
    const proxy = listWalkedFolderFilesLayerBrokerProxy();
    const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/sample/src' });
    proxy.implementation({
      fn: () => throwEnoent(),
    });

    const result = listWalkedFolderFilesLayerBroker({ packageSrcPath });

    expect(result).toStrictEqual([]);
  });
});
