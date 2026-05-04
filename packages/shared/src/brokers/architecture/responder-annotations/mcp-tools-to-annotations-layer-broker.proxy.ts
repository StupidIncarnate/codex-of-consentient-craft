import type { Dirent } from 'fs';
import { listFlowFilesLayerBrokerProxy } from './list-flow-files-layer-broker.proxy';
import { architectureSourceReadBrokerProxy } from '../source-read/architecture-source-read-broker.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

export const mcpToolsToAnnotationsLayerBrokerProxy = (): {
  setup: ({
    flowEntries,
    flowFiles,
  }: {
    flowEntries: Dirent[];
    flowFiles: { path: AbsoluteFilePath; source: ContentText }[];
  }) => void;
} => {
  const listProxy = listFlowFilesLayerBrokerProxy();
  const sourceProxy = architectureSourceReadBrokerProxy();

  return {
    setup: ({
      flowEntries,
      flowFiles,
    }: {
      flowEntries: Dirent[];
      flowFiles: { path: AbsoluteFilePath; source: ContentText }[];
    }): void => {
      listProxy.returns({ entries: flowEntries });

      const fileMap = new Map<AbsoluteFilePath, ContentText>();
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
