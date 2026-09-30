import type { DirEntrySync } from '#gateway/node/fs';
import { listFlowFilesLayerBroker } from './list-flow-files-layer-broker';
import { listFlowFilesLayerBrokerProxy } from './list-flow-files-layer-broker.proxy';

const PACKAGE_ROOT = '/repo/packages/mcp';
const FLOWS_DIR = '/repo/packages/mcp/src/flows';

const makeFileDirent = ({ name }: { name: string }): DirEntrySync => ({ name, kind: 'file' });

const makeDirDirent = ({ name }: { name: string }): DirEntrySync => ({ name, kind: 'directory' });

describe('listFlowFilesLayerBroker', () => {
  describe('no flows directory', () => {
    it('EMPTY: {readdir returns []} => returns empty array', () => {
      const proxy = listFlowFilesLayerBrokerProxy();
      proxy.returns({ dirPath: FLOWS_DIR, entries: [] });

      const result = listFlowFilesLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual([]);
    });
  });

  describe('flat flow files', () => {
    it('VALID: {single flow file in flows dir} => returns its absolute path', () => {
      const proxy = listFlowFilesLayerBrokerProxy();
      proxy.returns({
        dirPath: FLOWS_DIR,
        entries: [makeFileDirent({ name: 'architecture-flow.ts' })],
      });

      const result = listFlowFilesLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result.map(String)).toStrictEqual([
        '/repo/packages/mcp/src/flows/architecture-flow.ts',
      ]);
    });

    it('VALID: {non-flow file} => returns empty array (no match)', () => {
      const proxy = listFlowFilesLayerBrokerProxy();
      proxy.returns({
        dirPath: FLOWS_DIR,
        entries: [makeFileDirent({ name: 'architecture-broker.ts' })],
      });

      const result = listFlowFilesLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {test flow file excluded} => returns empty array', () => {
      const proxy = listFlowFilesLayerBrokerProxy();
      proxy.returns({
        dirPath: FLOWS_DIR,
        entries: [makeFileDirent({ name: 'architecture-flow.test.ts' })],
      });

      const result = listFlowFilesLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual([]);
    });
  });

  describe('subdirectory traversal', () => {
    it('VALID: {subdir containing a flow file} => recurses and returns nested flow path', () => {
      const proxy = listFlowFilesLayerBrokerProxy();
      const subDir = '/repo/packages/mcp/src/flows/architecture';
      proxy.returns({ dirPath: FLOWS_DIR, entries: [makeDirDirent({ name: 'architecture' })] });
      proxy.returns({
        dirPath: subDir,
        entries: [makeFileDirent({ name: 'architecture-flow.ts' })],
      });

      const result = listFlowFilesLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result.map(String)).toStrictEqual([
        '/repo/packages/mcp/src/flows/architecture/architecture-flow.ts',
      ]);
    });
  });
});
