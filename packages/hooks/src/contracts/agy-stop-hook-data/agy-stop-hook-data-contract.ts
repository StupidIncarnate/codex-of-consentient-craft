/**
 * PURPOSE: Zod schema for Antigravity Stop hook input data
 *
 * USAGE:
 * const hookData = agyStopHookDataContract.parse(input);
 * // Returns validated AgyStopHookData
 */
import { z } from '#gateway/npm/zod';

export const agyStopHookDataContract = z
  .object({
    executionNum: z.number().brand<'AgyStopHookDataExecutionNum'>().optional(),
    terminationReason: z.string().brand<'AgyStopHookDataTerminationReason'>().optional(),
    error: z.string().brand<'AgyStopHookDataError'>().optional(),
    fullyIdle: z.boolean().optional(),
    conversationId: z.string().brand<'AgyStopHookDataConversationId'>().optional(),
    workspacePaths: z.array(z.string().brand<'AgyStopHookDataWorkspacePaths'>()).optional(),
    transcriptPath: z.string().brand<'AgyStopHookDataTranscriptPath'>().optional(),
    artifactDirectoryPath: z.string().brand<'AgyStopHookDataArtifactDirectoryPath'>().optional(),
    modelName: z.string().brand<'AgyStopHookDataModelName'>().optional(),
  })
  .brand<'AgyStopHookData'>();

export type AgyStopHookData = z.infer<typeof agyStopHookDataContract>;
