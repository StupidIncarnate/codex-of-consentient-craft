import { FilePathStub, IdentifierStub, ImportPathStub } from '@dungeonmaster/shared/contracts';
import { barrelCompletenessLayerBroker } from './barrel-completeness-layer-broker';
import { barrelCompletenessLayerBrokerProxy } from './barrel-completeness-layer-broker.proxy';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';
import { FileNameStub } from '../../../contracts/file-name/file-name.stub';

describe('barrelCompletenessLayerBroker', () => {
  it('VALID: {every wrapper export re-exported, a type-only sibling needs none} => reports nothing and returns true', () => {
    const proxy = barrelCompletenessLayerBrokerProxy();
    const mockReport = jest.fn();
    const context = EslintContextStub({ report: mockReport });
    const node = TsestreeStub({ type: TsestreeNodeType.Program });
    const subpathDirectory = FilePathStub({ value: '/repo/packages/@gateway/node/src/fs/' });

    proxy.fsReaddirSync.returns({
      dirPath: subpathDirectory,
      entries: [
        { name: FileNameStub({ value: 'is-fs-error' }), isDirectory: true },
        { name: FileNameStub({ value: 'fs.ts' }), isDirectory: false },
      ],
    });
    proxy.fsReaddirSync.returns({
      dirPath: FilePathStub({ value: '/repo/packages/@gateway/node/src/fs/is-fs-error/' }),
      entries: [
        { name: FileNameStub({ value: 'fs-error.ts' }), isDirectory: false },
        { name: FileNameStub({ value: 'fs-error.stub.ts' }), isDirectory: false },
        { name: FileNameStub({ value: 'is-fs-error.ts' }), isDirectory: false },
        { name: FileNameStub({ value: 'is-fs-error.proxy.ts' }), isDirectory: false },
        { name: FileNameStub({ value: 'is-fs-error.test.ts' }), isDirectory: false },
      ],
    });
    proxy.fsReadFileSync.returns({
      path: FilePathStub({
        value: '/repo/packages/@gateway/node/src/fs/is-fs-error/fs-error.ts',
      }),
      contents: 'export interface FsError {}\n',
    });
    proxy.fsReadFileSync.returns({
      path: FilePathStub({
        value: '/repo/packages/@gateway/node/src/fs/is-fs-error/is-fs-error.ts',
      }),
      contents: 'export const isFsError = (): boolean => false;\n',
    });
    proxy.fsExistsSync.returns({
      path: FilePathStub({
        value: '/repo/packages/@gateway/node/src/fs/is-fs-error/is-fs-error.ts',
      }),
      exists: true,
    });
    proxy.fsExistsSync.returns({
      path: FilePathStub({
        value: '/repo/packages/@gateway/node/src/fs/is-fs-error/fs-error.ts',
      }),
      exists: true,
    });

    const result = barrelCompletenessLayerBroker({
      node,
      context,
      fileName: 'fs.ts',
      subpathDirectory,
      reexports: [
        {
          name: IdentifierStub({ value: 'isFsError' }),
          source: ImportPathStub({ value: './is-fs-error/is-fs-error' }),
        },
        {
          name: IdentifierStub({ value: 'FsError' }),
          source: ImportPathStub({ value: './is-fs-error/fs-error' }),
        },
      ],
    });

    expect(result).toBe(true);
    expect(mockReport.mock.calls).toStrictEqual([]);
  });

  it('INVALID: {a wrapper exports a value the barrel never re-exports} => reports barrelMissingReexport and returns false', () => {
    const proxy = barrelCompletenessLayerBrokerProxy();
    const mockReport = jest.fn();
    const context = EslintContextStub({ report: mockReport });
    const node = TsestreeStub({ type: TsestreeNodeType.Program });
    const subpathDirectory = FilePathStub({ value: '/repo/packages/@gateway/node/src/dns/' });

    proxy.fsReaddirSync.returns({
      dirPath: subpathDirectory,
      entries: [
        { name: FileNameStub({ value: 'resolve4' }), isDirectory: true },
        { name: FileNameStub({ value: 'dns.ts' }), isDirectory: false },
      ],
    });
    proxy.fsReaddirSync.returns({
      dirPath: FilePathStub({ value: '/repo/packages/@gateway/node/src/dns/resolve4/' }),
      entries: [{ name: FileNameStub({ value: 'resolve4.ts' }), isDirectory: false }],
    });
    proxy.fsReadFileSync.returns({
      path: FilePathStub({
        value: '/repo/packages/@gateway/node/src/dns/resolve4/resolve4.ts',
      }),
      contents: 'export const resolve4 = (): string[] => [];\n',
    });

    const result = barrelCompletenessLayerBroker({
      node,
      context,
      fileName: 'dns.ts',
      subpathDirectory,
      reexports: [],
    });

    expect(result).toBe(false);
    expect(mockReport).toHaveBeenCalledTimes(1);
    expect(mockReport).toHaveBeenCalledWith({
      node,
      messageId: 'barrelMissingReexport',
      data: { fileName: 'dns.ts', name: 'resolve4', wrapperFile: 'resolve4.ts' },
    });
  });

  it('INVALID: {a re-export points at a file that no longer exists} => reports barrelStaleReexport and returns false', () => {
    const proxy = barrelCompletenessLayerBrokerProxy();
    const mockReport = jest.fn();
    const context = EslintContextStub({ report: mockReport });
    const node = TsestreeStub({ type: TsestreeNodeType.Program });
    const subpathDirectory = FilePathStub({ value: '/repo/packages/@gateway/node/src/dgram/' });

    proxy.fsReaddirSync.returns({ dirPath: subpathDirectory, entries: [] });

    const name = IdentifierStub({ value: 'createSocket' });
    const source = ImportPathStub({ value: './create-socket/create-socket' });

    proxy.fsExistsSync.returns({
      path: FilePathStub({
        value: '/repo/packages/@gateway/node/src/dgram/create-socket/create-socket.ts',
      }),
      exists: false,
    });

    const result = barrelCompletenessLayerBroker({
      node,
      context,
      fileName: 'dgram.ts',
      subpathDirectory,
      reexports: [{ name, source }],
    });

    expect(result).toBe(false);
    expect(mockReport).toHaveBeenCalledTimes(1);
    expect(mockReport).toHaveBeenCalledWith({
      node,
      messageId: 'barrelStaleReexport',
      data: { fileName: 'dgram.ts', name, source },
    });
  });

  it('INVALID: {a re-export points at a file that exists but no longer carries that name} => reports barrelStaleReexport and returns false', () => {
    const proxy = barrelCompletenessLayerBrokerProxy();
    const mockReport = jest.fn();
    const context = EslintContextStub({ report: mockReport });
    const node = TsestreeStub({ type: TsestreeNodeType.Program });
    const subpathDirectory = FilePathStub({ value: '/repo/packages/@gateway/node/src/tls/' });

    proxy.fsReaddirSync.returns({ dirPath: subpathDirectory, entries: [] });
    proxy.fsExistsSync.returns({
      path: FilePathStub({
        value: '/repo/packages/@gateway/node/src/tls/create-server/create-server.ts',
      }),
      exists: true,
    });
    proxy.fsReadFileSync.returns({
      path: FilePathStub({
        value: '/repo/packages/@gateway/node/src/tls/create-server/create-server.ts',
      }),
      contents: 'export const startServer = (): void => {};\n',
    });

    const name = IdentifierStub({ value: 'createServer' });
    const source = ImportPathStub({ value: './create-server/create-server' });

    const result = barrelCompletenessLayerBroker({
      node,
      context,
      fileName: 'tls.ts',
      subpathDirectory,
      reexports: [{ name, source }],
    });

    expect(result).toBe(false);
    expect(mockReport).toHaveBeenCalledTimes(1);
    expect(mockReport).toHaveBeenCalledWith({
      node,
      messageId: 'barrelStaleReexport',
      data: { fileName: 'tls.ts', name, source },
    });
  });

  it('VALID: {re-export already flagged by single-home, source climbs out of the subpath} => skips it and returns true', () => {
    const proxy = barrelCompletenessLayerBrokerProxy();
    const mockReport = jest.fn();
    const context = EslintContextStub({ report: mockReport });
    const node = TsestreeStub({ type: TsestreeNodeType.Program });
    const subpathDirectory = FilePathStub({ value: '/repo/packages/@gateway/node/src/vm/' });

    proxy.fsReaddirSync.returns({ dirPath: subpathDirectory, entries: [] });

    const result = barrelCompletenessLayerBroker({
      node,
      context,
      fileName: 'vm.ts',
      subpathDirectory,
      reexports: [
        {
          name: IdentifierStub({ value: 'isFsError' }),
          source: ImportPathStub({ value: '../fs/is-fs-error/is-fs-error' }),
        },
      ],
    });

    expect(result).toBe(true);
    expect(mockReport.mock.calls).toStrictEqual([]);
  });

  it('VALID: {re-export already flagged by no-test-support-reexport, source ends in .proxy} => skips it and returns true', () => {
    const proxy = barrelCompletenessLayerBrokerProxy();
    const mockReport = jest.fn();
    const context = EslintContextStub({ report: mockReport });
    const node = TsestreeStub({ type: TsestreeNodeType.Program });
    const subpathDirectory = FilePathStub({
      value: '/repo/packages/@gateway/node/src/perf_hooks/',
    });

    proxy.fsReaddirSync.returns({ dirPath: subpathDirectory, entries: [] });

    const result = barrelCompletenessLayerBroker({
      node,
      context,
      fileName: 'perf_hooks.ts',
      subpathDirectory,
      reexports: [
        {
          name: IdentifierStub({ value: 'readFileSyncProxy' }),
          source: ImportPathStub({ value: './read-file-sync/read-file-sync.proxy' }),
        },
      ],
    });

    expect(result).toBe(true);
    expect(mockReport.mock.calls).toStrictEqual([]);
  });

  it('EMPTY: {no wrapper folders, no reexports} => reports nothing and returns true', () => {
    const proxy = barrelCompletenessLayerBrokerProxy();
    const mockReport = jest.fn();
    const context = EslintContextStub({ report: mockReport });
    const node = TsestreeStub({ type: TsestreeNodeType.Program });
    const subpathDirectory = FilePathStub({ value: '/repo/packages/@gateway/node/src/os/' });

    proxy.fsReaddirSync.returns({ dirPath: subpathDirectory, entries: [] });

    const result = barrelCompletenessLayerBroker({
      node,
      context,
      fileName: 'os.ts',
      subpathDirectory,
      reexports: [],
    });

    expect(result).toBe(true);
    expect(mockReport.mock.calls).toStrictEqual([]);
  });
});
