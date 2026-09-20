import { fileContentsContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, ContentText } from '@dungeonmaster/shared/contracts';

import { fetchJsonAdapterProxy } from '../../../adapters/fetch/json/fetch-json-adapter.proxy';
import { fsWriteTextAdapterProxy } from '../../../adapters/fs/write-text/fs-write-text-adapter.proxy';
import { recipeHttpStatics } from '../../../statics/recipe-http/recipe-http-statics';
import { transcriptLinesReadTransformer } from '../../../transformers/transcript-lines-read/transcript-lines-read-transformer';

export const recipesSessionWithNestedSubagentBrokerProxy = (): {
  laneAnswers: (params: {
    apiBaseUrl: ContentText;
    guilds: unknown;
    transcriptPaths: readonly AbsoluteFilePath[];
  }) => void;
  filesWritten: () => readonly unknown[];
  uuidsIn: (params: { filePath: AbsoluteFilePath }) => readonly unknown[];
  timestampsIn: (params: { filePath: AbsoluteFilePath }) => readonly unknown[];
  completionAgentIdsIn: (params: { filePath: AbsoluteFilePath }) => readonly unknown[];
  assistantTextsIn: (params: { filePath: AbsoluteFilePath }) => readonly unknown[];
  toolUseIdsIn: (params: { filePath: AbsoluteFilePath }) => readonly unknown[];
} => {
  const fetchProxy = fetchJsonAdapterProxy();
  const writeProxy = fsWriteTextAdapterProxy();

  return {
    laneAnswers: ({
      apiBaseUrl,
      guilds,
      transcriptPaths,
    }: {
      apiBaseUrl: ContentText;
      guilds: unknown;
      transcriptPaths: readonly AbsoluteFilePath[];
    }): void => {
      fetchProxy.answers({
        url: `${apiBaseUrl}${recipeHttpStatics.routes.guilds}`,
        method: recipeHttpStatics.methods.get,
        body: guilds,
      });
      transcriptPaths.forEach((filePath) => {
        writeProxy.succeeds({ filePath });
      });
    },

    filesWritten: (): readonly unknown[] => writeProxy.pathsWritten(),

    uuidsIn: ({ filePath }: { filePath: AbsoluteFilePath }): readonly unknown[] =>
      transcriptLinesReadTransformer({
        contents: fileContentsContract.parse(String(writeProxy.writtenTo({ filePath }))),
      }).map((line) => line.uuid),

    timestampsIn: ({ filePath }: { filePath: AbsoluteFilePath }): readonly unknown[] =>
      transcriptLinesReadTransformer({
        contents: fileContentsContract.parse(String(writeProxy.writtenTo({ filePath }))),
      }).map((line) => line.timestamp),

    completionAgentIdsIn: ({ filePath }: { filePath: AbsoluteFilePath }): readonly unknown[] =>
      transcriptLinesReadTransformer({
        contents: fileContentsContract.parse(String(writeProxy.writtenTo({ filePath }))),
      }).map((line) => line.toolUseResult?.agentId ?? null),

    assistantTextsIn: ({ filePath }: { filePath: AbsoluteFilePath }): readonly unknown[] =>
      transcriptLinesReadTransformer({
        contents: fileContentsContract.parse(String(writeProxy.writtenTo({ filePath }))),
      }).flatMap((line): readonly unknown[] =>
        typeof line.message.content === 'string'
          ? [line.message.content]
          : line.message.content.map((item) => item.text ?? null),
      ),

    toolUseIdsIn: ({ filePath }: { filePath: AbsoluteFilePath }): readonly unknown[] =>
      transcriptLinesReadTransformer({
        contents: fileContentsContract.parse(String(writeProxy.writtenTo({ filePath }))),
      }).flatMap((line): readonly unknown[] =>
        typeof line.message.content === 'string'
          ? [null]
          : line.message.content.map((item) => item.id ?? item.tool_use_id ?? null),
      ),
  };
};
