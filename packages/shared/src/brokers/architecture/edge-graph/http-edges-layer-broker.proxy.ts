import { listTsFilesLayerBrokerProxy } from './list-ts-files-layer-broker.proxy';
import { readFileLayerBrokerProxy } from './read-file-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const httpEdgesLayerBrokerProxy = (): {
  setup: ({
    serverStaticsSource,
    webStaticsSource,
    flowFiles,
    brokerFiles,
  }: {
    serverStaticsSource: ContentText;
    webStaticsSource: ContentText;
    flowFiles: { path: AbsoluteFilePath; source: ContentText }[];
    brokerFiles: { path: AbsoluteFilePath; source: ContentText }[];
  }) => void;
} => {
  const listFilesProxy = listTsFilesLayerBrokerProxy();
  const readFileProxy = readFileLayerBrokerProxy();

  return {
    setup: ({
      serverStaticsSource,
      webStaticsSource,
      flowFiles,
      brokerFiles,
    }: {
      serverStaticsSource: ContentText;
      webStaticsSource: ContentText;
      flowFiles: { path: AbsoluteFilePath; source: ContentText }[];
      brokerFiles: { path: AbsoluteFilePath; source: ContentText }[];
    }): void => {
      const allFilePaths = [...flowFiles.map((f) => f.path), ...brokerFiles.map((b) => b.path)];

      listFilesProxy.setupVirtualTree({ filePaths: allFilePaths });

      const fileMap = new Map<AbsoluteFilePath, ContentText>();
      fileMap.set(
        AbsoluteFilePathStub({
          value: '/repo/packages/server/src/statics/api-routes/api-routes-statics.ts',
        }),
        serverStaticsSource,
      );
      fileMap.set(
        AbsoluteFilePathStub({
          value: '/repo/packages/web/src/statics/web-config/web-config-statics.ts',
        }),
        webStaticsSource,
      );
      for (const f of flowFiles) {
        fileMap.set(f.path, f.source);
      }
      for (const b of brokerFiles) {
        fileMap.set(b.path, b.source);
      }

      readFileProxy.setupImplementation({
        fn: (filePath: ContentText): ContentText => {
          for (const [key, source] of fileMap) {
            if (String(key) === String(filePath)) {
              return source;
            }
          }
          return ContentTextStub({ value: '' });
        },
      });
    },
  };
};
