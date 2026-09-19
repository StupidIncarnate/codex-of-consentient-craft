/**
 * PURPOSE: Zod schema for Antigravity PreToolUse hook input data
 *
 * USAGE:
 * const hookData = agyPreToolHookDataContract.parse(input);
 * // Returns validated AgyPreToolHookData
 */
import { z } from 'zod';

export const agyPreToolHookDataContract = z
  .object({
    conversationId: z.string().optional(),
    workspacePaths: z.array(z.string()).optional(),
    transcriptPath: z.string().optional(),
    artifactDirectoryPath: z.string().optional(),
    modelName: z.string().optional(),
    stepIdx: z.number().optional(),
    toolCall: z
      .object({
        name: z.string().optional(),
        args: z.record(z.unknown()).optional(),
      })
      .optional(),
  })
  .brand<'AgyPreToolHookData'>();

export type AgyPreToolHookData = z.infer<typeof agyPreToolHookDataContract>;
