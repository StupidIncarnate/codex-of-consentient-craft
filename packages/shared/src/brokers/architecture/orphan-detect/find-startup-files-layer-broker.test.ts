import type { DirEntrySync } from '#gateway/node/fs';
import { findStartupFilesLayerBroker } from './find-startup-files-layer-broker';
import { findStartupFilesLayerBrokerProxy } from './find-startup-files-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';

const fileEntry = ({ name }: { name: string }): DirEntrySync => ({ name, kind: 'file' });
const dirEntry = ({ name }: { name: string }): DirEntrySync => ({ name, kind: 'directory' });

describe('findStartupFilesLayerBroker', () => {
  it('VALID: {startup dir has start-app.ts} => returns the absolute path', () => {
    const proxy = findStartupFilesLayerBrokerProxy();
    const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/sample/src' });
    proxy.setupReturns({ packageSrcPath, entries: [fileEntry({ name: 'start-app.ts' })] });

    const result = findStartupFilesLayerBroker({ packageSrcPath });

    expect(result.map(String)).toStrictEqual(['/repo/packages/sample/src/startup/start-app.ts']);
  });

  it('VALID: {startup dir has start-app.tsx} => returns the absolute path', () => {
    const proxy = findStartupFilesLayerBrokerProxy();
    const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/sample/src' });
    proxy.setupReturns({ packageSrcPath, entries: [fileEntry({ name: 'start-app.tsx' })] });

    const result = findStartupFilesLayerBroker({ packageSrcPath });

    expect(result.map(String)).toStrictEqual(['/repo/packages/sample/src/startup/start-app.tsx']);
  });

  it('VALID: {non-start file in startup dir} => excluded from results', () => {
    const proxy = findStartupFilesLayerBrokerProxy();
    const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/sample/src' });
    proxy.setupReturns({
      packageSrcPath,
      entries: [fileEntry({ name: 'helper.ts' }), fileEntry({ name: 'start-app.ts' })],
    });

    const result = findStartupFilesLayerBroker({ packageSrcPath });

    expect(result.map(String)).toStrictEqual(['/repo/packages/sample/src/startup/start-app.ts']);
  });

  it('VALID: {test file in startup dir} => excluded from results', () => {
    const proxy = findStartupFilesLayerBrokerProxy();
    const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/sample/src' });
    proxy.setupReturns({
      packageSrcPath,
      entries: [fileEntry({ name: 'start-app.ts' }), fileEntry({ name: 'start-app.test.ts' })],
    });

    const result = findStartupFilesLayerBroker({ packageSrcPath });

    expect(result.map(String)).toStrictEqual(['/repo/packages/sample/src/startup/start-app.ts']);
  });

  it('VALID: {directory inside startup dir} => excluded from results', () => {
    const proxy = findStartupFilesLayerBrokerProxy();
    const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/sample/src' });
    proxy.setupReturns({
      packageSrcPath,
      entries: [dirEntry({ name: 'sub' }), fileEntry({ name: 'start-app.ts' })],
    });

    const result = findStartupFilesLayerBroker({ packageSrcPath });

    expect(result.map(String)).toStrictEqual(['/repo/packages/sample/src/startup/start-app.ts']);
  });

  it('EMPTY: {startup dir missing} => returns empty array (no throw)', () => {
    const proxy = findStartupFilesLayerBrokerProxy();
    const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/sample/src' });
    proxy.setupReaddirThrows({
      packageSrcPath,
      error: FileMissingErrorStub({ path: packageSrcPath }),
    });

    const result = findStartupFilesLayerBroker({ packageSrcPath });

    expect(result).toStrictEqual([]);
  });
});
