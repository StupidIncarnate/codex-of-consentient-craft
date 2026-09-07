import { transcriptResolveForHookBrokerProxy } from '../../../brokers/transcript/resolve-for-hook/transcript-resolve-for-hook-broker.proxy';
import { folderDetailWasCalledBrokerProxy } from '../../../brokers/folder-detail/was-called/folder-detail-was-called-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

export const HookPreFolderDetailResponderProxy = (): {
  setupNoTranscript: (params: { transcriptPath: string }) => void;
  setupUndetermined: (params: { transcriptPath: string }) => void;
  setupAlreadyCalled: (params: { transcriptPath: string; folderType: string }) => void;
  setupNeverCalled: (params: { transcriptPath: string; folderType: string }) => void;
} => {
  const transcriptProxy = transcriptResolveForHookBrokerProxy();
  const lookupProxy = folderDetailWasCalledBrokerProxy();

  return {
    setupNoTranscript: ({ transcriptPath }: { transcriptPath: string }): void => {
      transcriptProxy.setupExists({ path: transcriptPath, exists: false });
    },
    setupUndetermined: ({ transcriptPath }: { transcriptPath: string }): void => {
      transcriptProxy.setupExists({ path: transcriptPath, exists: true });
      lookupProxy.setupReadError({ transcriptFilePath: FilePathStub({ value: transcriptPath }) });
    },
    setupAlreadyCalled: ({
      transcriptPath,
      folderType,
    }: {
      transcriptPath: string;
      folderType: string;
    }): void => {
      transcriptProxy.setupExists({ path: transcriptPath, exists: true });
      lookupProxy.setupTranscript({
        transcriptFilePath: FilePathStub({ value: transcriptPath }),
        contents: JSON.stringify({
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: 'toolu_1',
                name: 'mcp__dungeonmaster__get-folder-detail',
                input: { folderType },
              },
            ],
          },
        }),
      });
    },
    setupNeverCalled: ({
      transcriptPath,
      folderType,
    }: {
      transcriptPath: string;
      folderType: string;
    }): void => {
      transcriptProxy.setupExists({ path: transcriptPath, exists: true });
      lookupProxy.setupTranscript({
        transcriptFilePath: FilePathStub({ value: transcriptPath }),
        contents: JSON.stringify({
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: 'toolu_1',
                name: 'mcp__dungeonmaster__get-folder-detail',
                input: { folderType: `not-${folderType}` },
              },
            ],
          },
        }),
      });
    },
  };
};
