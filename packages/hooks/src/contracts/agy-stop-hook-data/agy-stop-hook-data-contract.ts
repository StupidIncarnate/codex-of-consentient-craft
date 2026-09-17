/**
 * PURPOSE: Zod schema for Antigravity Stop hook input data
 *
 * USAGE:
 * const hookData = agyStopHookDataContract.parse(input);
 * // Returns validated AgyStopHookData
 */
import { z } from 'zod';

export const agyStopHookDataContract = z
  .object({
    executionNum: z.number().optional(),
    terminationReason: z.string().optional(),
    error: z.string().optional(),
    fullyIdle: z.boolean().optional(),
    conversationId: z.string().optional(),
    workspacePaths: z.array(z.string()).optional(),
    transcriptPath: z.string().optional(),
    artifactDirectoryPath: z.string().optional(),
    modelName: z.string().optional(),
  })
  .brand<'AgyStopHookData'>();

export type AgyStopHookData = z.infer<typeof agyStopHookDataContract>;
