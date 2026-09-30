/**
 * PURPOSE: Zod schema for Antigravity PreToolUse hook input data
 *
 * USAGE:
 * const hookData = agyPreToolHookDataContract.parse(input);
 * // Returns validated AgyPreToolHookData
 */
import { z } from '#gateway/npm/zod';

export const agyPreToolHookDataContract = z
  .object({
    conversationId: z.string().brand<'AgyPreToolHookDataConversationId'>().optional(),
    workspacePaths: z.array(z.string().brand<'AgyPreToolHookDataWorkspacePaths'>()).optional(),
    transcriptPath: z.string().brand<'AgyPreToolHookDataTranscriptPath'>().optional(),
    artifactDirectoryPath: z.string().brand<'AgyPreToolHookDataArtifactDirectoryPath'>().optional(),
    modelName: z.string().brand<'AgyPreToolHookDataModelName'>().optional(),
    stepIdx: z.number().brand<'AgyPreToolHookDataStepIdx'>().optional(),
    toolCall: z
      .object({
        name: z.string().brand<'AgyPreToolHookDataToolCallName'>().optional(),
        args: z.record(z.string(), z.unknown()).optional(),
      }).brand<'AgyPreToolHookDataToolCall'>()
      .optional(),
  })
  .brand<'AgyPreToolHookData'>();

export type AgyPreToolHookData = z.infer<typeof agyPreToolHookDataContract>;
