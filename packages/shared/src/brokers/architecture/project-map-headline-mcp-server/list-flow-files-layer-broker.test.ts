import { listFlowFilesLayerBroker } from './list-flow-files-layer-broker';
import { listFlowFilesLayerBrokerProxy } from './list-flow-files-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import type { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

type Dirent = ReturnType<typeof safeReaddirLayerBroker>[0];

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/mcp' });

const makeFileDirent = ({ name }: { name: string }): Dirent =>
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

const makeDirDirent = ({ name }: { name: string }): Dirent =>
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

describe('listFlowFilesLayerBroker', () => {
  describe('no flows directory', () => {
    it('EMPTY: {readdir returns []} => returns empty array', () => {
      const proxy = listFlowFilesLayerBrokerProxy();
      proxy.returns({ entries: [] });

      const result = listFlowFilesLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual([]);
    });
  });

  describe('flat flow files', () => {
    it('VALID: {single flow file in flows dir} => returns its absolute path', () => {
      const proxy = listFlowFilesLayerBrokerProxy();
      proxy.returns({ entries: [makeFileDirent({ name: 'architecture-flow.ts' })] });

      const result = listFlowFilesLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result.map(String)).toStrictEqual([
        '/repo/packages/mcp/src/flows/architecture-flow.ts',
      ]);
    });

    it('VALID: {file not ending in -flow.ts} => returns empty array (no match)', () => {
      const proxy = listFlowFilesLayerBrokerProxy();
      proxy.returns({ entries: [makeFileDirent({ name: 'architecture-broker.ts' })] });

      const result = listFlowFilesLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {test flow file excluded} => returns empty array', () => {
      const proxy = listFlowFilesLayerBrokerProxy();
      proxy.returns({ entries: [makeFileDirent({ name: 'architecture-flow.test.ts' })] });

      const result = listFlowFilesLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual([]);
    });
  });

  describe('subdirectory traversal', () => {
    it('VALID: {subdir containing a flow file} => recurses and returns nested flow path', () => {
      const proxy = listFlowFilesLayerBrokerProxy();

      // First call: flows/ dir contains one subdirectory
      proxy.returns({ entries: [makeDirDirent({ name: 'architecture' })] });
      // Second call: architecture/ subdir contains one flow file
      proxy.returns({ entries: [makeFileDirent({ name: 'architecture-flow.ts' })] });

      const result = listFlowFilesLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result.map(String)).toStrictEqual([
        '/repo/packages/mcp/src/flows/architecture/architecture-flow.ts',
      ]);
    });
  });
});
