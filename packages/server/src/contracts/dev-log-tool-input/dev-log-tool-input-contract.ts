/**
 * PURPOSE: Defines the optional fields the dev-log tool-input formatter extracts per tool
 *
 * USAGE:
 * const parsed = devLogToolInputContract.parse(input);
 * // Returns: { file_path?, command?, pattern?, description?, subject?, taskId?, status?, questId?, guildId? }
 */

import { z } from 'zod';

export const devLogToolInputContract = z
  .object({
    file_path: z.string().min(1).brand<'DevLogFilePath'>().optional(),
    command: z.string().min(1).brand<'DevLogCommand'>().optional(),
    pattern: z.string().min(1).brand<'DevLogPattern'>().optional(),
    description: z.string().min(1).brand<'DevLogDescription'>().optional(),
    subject: z.string().min(1).brand<'DevLogSubject'>().optional(),
    taskId: z.string().min(1).brand<'DevLogTaskId'>().optional(),
    status: z.string().min(1).brand<'DevLogToolStatus'>().optional(),
    questId: z.string().min(1).brand<'DevLogToolQuestId'>().optional(),
    guildId: z.string().min(1).brand<'DevLogToolGuildId'>().optional(),
  })
  .passthrough();

export type DevLogToolInput = z.infer<typeof devLogToolInputContract>;
