/**
 * PURPOSE: Validates the minimal shape of .dungeonmaster.json needed to extract the port field
 *
 * USAGE:
 * const config = projectConfigContract.safeParse(JSON.parse(contents));
 * if (config.success) return config.data.dungeonmaster?.port;
 */

import { z } from '#gateway/npm/zod';

export const projectConfigContract = z
  .object({
    dungeonmaster: z
      .object({
        port: z
          .number()
          .int()
          .min(1)
          .max(65_535)
          .brand<'ProjectConfigDungeonmasterPort'>()
          .optional(),
      })
      .brand<'ProjectConfigDungeonmaster'>()
      .optional(),
  })
  .brand<'ProjectConfig'>();

export type ProjectConfig = z.infer<typeof projectConfigContract>;
