import { findStartupFilesLayerBroker } from './find-startup-files-layer-broker';
import { findStartupFilesLayerBrokerProxy } from './find-startup-files-layer-broker.proxy';
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

describe('findStartupFilesLayerBroker', () => {
  it('VALID: {startup dir has start-app.ts} => returns the absolute path', () => {
    const proxy = findStartupFilesLayerBrokerProxy();
    proxy.setupReturns({ entries: [fileEntry({ name: 'start-app.ts' })] });
    const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/sample/src' });

    const result = findStartupFilesLayerBroker({ packageSrcPath });

    expect(result.map(String)).toStrictEqual(['/repo/packages/sample/src/startup/start-app.ts']);
  });

  it('VALID: {startup dir has start-app.tsx} => returns the absolute path', () => {
    const proxy = findStartupFilesLayerBrokerProxy();
    proxy.setupReturns({ entries: [fileEntry({ name: 'start-app.tsx' })] });
    const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/sample/src' });

    const result = findStartupFilesLayerBroker({ packageSrcPath });

    expect(result.map(String)).toStrictEqual(['/repo/packages/sample/src/startup/start-app.tsx']);
  });

  it('VALID: {non-start file in startup dir} => excluded from results', () => {
    const proxy = findStartupFilesLayerBrokerProxy();
    proxy.setupReturns({
      entries: [fileEntry({ name: 'helper.ts' }), fileEntry({ name: 'start-app.ts' })],
    });
    const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/sample/src' });

    const result = findStartupFilesLayerBroker({ packageSrcPath });

    expect(result.map(String)).toStrictEqual(['/repo/packages/sample/src/startup/start-app.ts']);
  });

  it('VALID: {test file in startup dir} => excluded from results', () => {
    const proxy = findStartupFilesLayerBrokerProxy();
    proxy.setupReturns({
      entries: [fileEntry({ name: 'start-app.ts' }), fileEntry({ name: 'start-app.test.ts' })],
    });
    const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/sample/src' });

    const result = findStartupFilesLayerBroker({ packageSrcPath });

    expect(result.map(String)).toStrictEqual(['/repo/packages/sample/src/startup/start-app.ts']);
  });

  it('VALID: {directory inside startup dir} => excluded from results', () => {
    const proxy = findStartupFilesLayerBrokerProxy();
    proxy.setupReturns({
      entries: [dirEntry({ name: 'sub' }), fileEntry({ name: 'start-app.ts' })],
    });
    const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/sample/src' });

    const result = findStartupFilesLayerBroker({ packageSrcPath });

    expect(result.map(String)).toStrictEqual(['/repo/packages/sample/src/startup/start-app.ts']);
  });

  it('EMPTY: {startup dir missing} => returns empty array (no throw)', () => {
    const proxy = findStartupFilesLayerBrokerProxy();
    proxy.setupReaddirThrows({ error: new Error('ENOENT') });
    const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/sample/src' });

    const result = findStartupFilesLayerBroker({ packageSrcPath });

    expect(result).toStrictEqual([]);
  });
});
