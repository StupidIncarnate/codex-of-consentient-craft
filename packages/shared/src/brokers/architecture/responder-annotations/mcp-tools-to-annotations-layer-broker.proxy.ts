import type { DirEntrySync } from '#gateway/node/fs';
import { listFlowFilesLayerBrokerProxy } from './list-flow-files-layer-broker.proxy';
import { architectureSourceReadBrokerProxy } from '../source-read/architecture-source-read-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

export const mcpToolsToAnnotationsLayerBrokerProxy = (): {
  setup: ({
    packageRoot,
    flowEntries,
    flowFiles,
  }: {
    packageRoot: string;
    flowEntries: DirEntrySync[];
    flowFiles: { path: string; source: ContentText }[];
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
      flowFiles: { path: string; source: ContentText }[];
    }): void => {
      listProxy.returns({
        dirPath: `${String(packageRoot)}/src/flows`,
        entries: flowEntries,
      });

      const fileMap = new Map<string, ContentText>();
      for (const f of flowFiles) {
        fileMap.set(f.path, f.source);
      }
      const fileImpl = (filePath: ContentText): ContentText => {
        for (const [key, source] of fileMap) {
          if (String(key) === String(filePath)) {
            return source;
          }
        }
        return ContentTextStub({ value: '' });
      };
      sourceProxy.setupImplementation({ fn: fileImpl });
    },
  };
};
