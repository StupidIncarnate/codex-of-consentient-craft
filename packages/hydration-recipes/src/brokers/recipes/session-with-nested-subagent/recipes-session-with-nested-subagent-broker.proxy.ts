import type { ContentText } from '@dungeonmaster/shared/contracts';

import { fetchJsonProxy } from '#gateway/node/fetch/fetch-json/fetch-json.proxy';
import { writeFileCreatingParentProxy } from '#gateway/node/fs__promises/write-file-creating-parent/write-file-creating-parent.proxy';
import { recipeHttpStatics } from '../../../statics/recipe-http/recipe-http-statics';
import { transcriptLinesReadTransformer } from '../../../transformers/transcript-lines-read/transcript-lines-read-transformer';

export const recipesSessionWithNestedSubagentBrokerProxy = (): {
  laneAnswers: (params: {
    apiBaseUrl: ContentText;
    guilds: unknown;
    transcriptPaths: readonly string[];
  }) => void;
  filesWritten: () => readonly unknown[];
  uuidsIn: (params: { filePath: string }) => readonly unknown[];
  timestampsIn: (params: { filePath: string }) => readonly unknown[];
  completionAgentIdsIn: (params: { filePath: string }) => readonly unknown[];
  assistantTextsIn: (params: { filePath: string }) => readonly unknown[];
  toolUseIdsIn: (params: { filePath: string }) => readonly unknown[];
} => {
  const fetchProxy = fetchJsonProxy();
  const writeProxy = writeFileCreatingParentProxy();
  const stagedPaths: string[] = [];

  return {
    laneAnswers: ({
      apiBaseUrl,
      guilds,
      transcriptPaths,
    }: {
      apiBaseUrl: ContentText;
      guilds: unknown;
      transcriptPaths: readonly string[];
    }): void => {
      fetchProxy.setupSuccess({
        url: `${apiBaseUrl}${recipeHttpStatics.routes.guilds}`,
        body: guilds,
      });
      transcriptPaths.forEach((filePath) => {
        stagedPaths.push(filePath);
        writeProxy.succeeds({ path: filePath });
      });
    },

    filesWritten: (): readonly unknown[] =>
      stagedPaths.filter((path) => writeProxy.writtenContentsFor({ path }) !== undefined),

    uuidsIn: ({ filePath }: { filePath: string }): readonly unknown[] =>
      transcriptLinesReadTransformer({
        contents: String(writeProxy.writtenContentsFor({ path: filePath })),
      }).map((line) => line.uuid),

    timestampsIn: ({ filePath }: { filePath: string }): readonly unknown[] =>
      transcriptLinesReadTransformer({
        contents: String(writeProxy.writtenContentsFor({ path: filePath })),
      }).map((line) => line.timestamp),

    completionAgentIdsIn: ({ filePath }: { filePath: string }): readonly unknown[] =>
      transcriptLinesReadTransformer({
        contents: String(writeProxy.writtenContentsFor({ path: filePath })),
      }).map((line) => line.toolUseResult?.agentId ?? null),

    assistantTextsIn: ({ filePath }: { filePath: string }): readonly unknown[] =>
      transcriptLinesReadTransformer({
        contents: String(writeProxy.writtenContentsFor({ path: filePath })),
      }).flatMap((line): readonly unknown[] =>
        typeof line.message.content === 'string'
          ? [line.message.content]
          : line.message.content.map((item) => item.text ?? null),
      ),

    toolUseIdsIn: ({ filePath }: { filePath: string }): readonly unknown[] =>
      transcriptLinesReadTransformer({
        contents: String(writeProxy.writtenContentsFor({ path: filePath })),
      }).flatMap((line): readonly unknown[] =>
        typeof line.message.content === 'string'
          ? [null]
          : line.message.content.map((item) => item.id ?? item.tool_use_id ?? null),
      ),
  };
};
