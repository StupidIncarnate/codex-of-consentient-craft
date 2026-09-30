/**
 * PURPOSE: Defines the optional fields the dev-log tool-input formatter extracts per tool
 *
 * USAGE:
 * const parsed = devLogToolInputContract.parse(input);
 * // Returns: { file_path?, command?, pattern?, description?, subject?, taskId?, status?, questId?, guildId? }
 */

import { z } from '#gateway/npm/zod';
import { questContract, guildContract } from '@dungeonmaster/shared/contracts';

export const devLogToolInputContract = z
  .object({
    file_path: z.string().min(1).brand<'DevLogToolInputFilePath'>().optional(),
    command: z.string().min(1).brand<'DevLogToolInputCommand'>().optional(),
    pattern: z.string().min(1).brand<'DevLogToolInputPattern'>().optional(),
    description: z.string().min(1).brand<'DevLogToolInputDescription'>().optional(),
    subject: z.string().min(1).brand<'DevLogToolInputSubject'>().optional(),
    taskId: z.string().min(1).brand<'DevLogToolInputTaskId'>().optional(),
    status: z.string().min(1).brand<'DevLogToolInputStatus'>().optional(),
    questId: questContract.shape.id.optional(),
    guildId: guildContract.shape.id.optional(),
  })
  .loose()
  .brand<'DevLogToolInput'>();

export type DevLogToolInput = z.infer<typeof devLogToolInputContract>;
