import type { Dirent } from 'fs';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { listFlowFilesLayerBrokerProxy } from './list-flow-files-layer-broker.proxy';
import { toolsSectionRenderLayerBrokerProxy } from './tools-section-render-layer-broker.proxy';

const buildFileDirent = ({ name }: { name: string }): Dirent =>
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

const buildDirDirent = ({ name }: { name: string }): Dirent =>
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

export const architectureProjectMapHeadlineMcpServerBrokerProxy = (): {
  setup: ({
    flowFiles,
    responderFiles,
    adapterFiles,
  }: {
    flowFiles: { path: AbsoluteFilePath; source: ContentText }[];
    responderFiles: { path: AbsoluteFilePath; source: ContentText }[];
    adapterFiles: { path: AbsoluteFilePath; source: ContentText }[];
  }) => void;
} => {
  const listProxy = listFlowFilesLayerBrokerProxy();
  const toolsProxy = toolsSectionRenderLayerBrokerProxy();

  return {
    setup: ({
      flowFiles,
      responderFiles,
      adapterFiles,
    }: {
      flowFiles: { path: AbsoluteFilePath; source: ContentText }[];
      responderFiles: { path: AbsoluteFilePath; source: ContentText }[];
      adapterFiles: { path: AbsoluteFilePath; source: ContentText }[];
    }): void => {
      // Build a unified file map for all source reads
      const fileMap = new Map<AbsoluteFilePath, ContentText>();
      for (const f of flowFiles) {
        fileMap.set(f.path, f.source);
      }
      for (const r of responderFiles) {
        fileMap.set(r.path, r.source);
      }
      for (const a of adapterFiles) {
        fileMap.set(a.path, a.source);
      }

      // Build a directory tree from flow file paths so the readdir mock can traverse
      // correctly. For each path like /repo/packages/mcp/src/flows/architecture/arch-flow.ts,
      // we add:
      //   /repo/packages/mcp/src/flows → [Dir: architecture]
      //   /repo/packages/mcp/src/flows/architecture → [File: arch-flow.ts]
      const dirTree = new Map<AbsoluteFilePath, Dirent[]>();
      for (const f of flowFiles) {
        const parts = String(f.path).split('/');
        const lastSegIdx = parts.length - 1;
        const parentSegIdx = parts.length - 1 - 1;
        const fileName = parts[lastSegIdx] ?? '';
        const parentDir = parts.slice(0, lastSegIdx).join('/') as AbsoluteFilePath;
        const grandParentDir = parts.slice(0, parentSegIdx).join('/') as AbsoluteFilePath;
        const subDirName = parts[parentSegIdx] ?? '';

        const existing = dirTree.get(parentDir) ?? [];
        if (!existing.some((e) => e.name === fileName)) {
          existing.push(buildFileDirent({ name: fileName }));
          dirTree.set(parentDir, existing);
        }
        const grandExisting = dirTree.get(grandParentDir) ?? [];
        if (!grandExisting.some((e) => e.name === subDirName)) {
          grandExisting.push(buildDirDirent({ name: subDirName }));
          dirTree.set(grandParentDir, grandExisting);
        }
      }

      // Wire the readdir mock to use the directory tree
      listProxy.implementation({
        fn: (dirPath: string): Dirent[] => dirTree.get(dirPath as AbsoluteFilePath) ?? [],
      });

      // Unified readFileSync implementation covering flows, responders, and adapters
      const unifiedImpl = (filePath: ContentText): ContentText => {
        for (const [key, source] of fileMap) {
          if (String(key) === String(filePath)) {
            return source;
          }
        }
        return ContentTextStub({ value: '' });
      };

      toolsProxy.setupImplementation({ fn: unifiedImpl });
    },
  };
};
