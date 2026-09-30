import type { DirEntrySync } from '#gateway/node/fs';
import { listFlowFilesLayerBrokerProxy } from './list-flow-files-layer-broker.proxy';
import { architectureSourceReadBrokerProxy } from '../source-read/architecture-source-read-broker.proxy';

export const mcpToolsToAnnotationsLayerBrokerProxy = (): {
  setup: ({
    packageRoot,
    flowEntries,
    flowFiles,
  }: {
    packageRoot: string;
    flowEntries: DirEntrySync[];
    flowFiles: { path: string; source: string }[];
  }) => void;
} => {
  const listProxy = listFlowFilesLayerBrokerProxy();
  const sourceProxy = architectureSourceReadBrokerProxy();

  return {
    setup: ({
      packageRoot,
      flowEntries,
      flowFiles,
    }: {
      packageRoot: string;
      flowEntries: DirEntrySync[];
      flowFiles: { path: string; source: string }[];
    }): void => {
      listProxy.returns({
        dirPath: `${String(packageRoot)}/src/flows`,
        entries: flowEntries,
      });

      const fileMap = new Map<string, string>();
      for (const f of flowFiles) {
        fileMap.set(f.path, f.source);
      }
      const fileImpl = (filePath: string): string => {
        for (const [key, source] of fileMap) {
          if (String(key) === String(filePath)) {
            return source;
          }
        }
        return '';
      };
      sourceProxy.setupImplementation({ fn: fileImpl });
    },
  };
};
