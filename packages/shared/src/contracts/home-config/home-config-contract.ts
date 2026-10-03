/**
 * PURPOSE: Defines the structure of the dungeonmaster home's config file
 *
 * USAGE:
 * homeConfigContract.parse({guilds: [{id: 'f47ac10b-...', name: 'My Guild', path: '/home/user/my-guild', createdAt: '2024-01-15T10:00:00.000Z'}]});
 * // Returns: HomeConfig object
 */

import { z } from '#gateway/npm/zod';

import { machineResourcesStatics } from '../../statics/machine-resources/machine-resources-statics';
import { guildContract } from '../guild/guild-contract';

export const homeConfigContract = z
  .object({
    guilds: z.array(guildContract).default([]),
    resources: z
      .object({
        maxMemoryPercent: z
          .number()
          .int()
          .min(machineResourcesStatics.maxMemoryPercent.min)
          .max(machineResourcesStatics.maxMemoryPercent.max)
          .default(machineResourcesStatics.maxMemoryPercent.default)
          .brand<'HomeConfigResourcesMaxMemoryPercent'>(),
        maxCpuPercent: z
          .number()
          .int()
          .min(machineResourcesStatics.maxCpuPercent.min)
          .max(machineResourcesStatics.maxCpuPercent.max)
          .default(machineResourcesStatics.maxCpuPercent.default)
          .brand<'HomeConfigResourcesMaxCpuPercent'>(),
        maxDiskMB: z
          .number()
          .int()
          .min(machineResourcesStatics.maxDiskMB.min)
          .default(machineResourcesStatics.maxDiskMB.default)
          .brand<'HomeConfigResourcesMaxDiskMB'>(),
      })
      .brand<'HomeConfigResources'>()
      .optional(),
  })
  .brand<'HomeConfig'>();

export type HomeConfig = z.infer<typeof homeConfigContract>;
