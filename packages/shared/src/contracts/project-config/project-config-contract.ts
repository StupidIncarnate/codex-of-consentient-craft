/**
 * PURPOSE: Validates the minimal shape of .dungeonmaster.json needed to extract the port field
 *
 * USAGE:
 * const config = projectConfigContract.safeParse(JSON.parse(contents));
 * if (config.success) return config.data.dungeonmaster?.port;
 */

import { z } from 'zod';

import { networkPortContract } from '../network-port/network-port-contract';

export const projectConfigContract = z.object({
  dungeonmaster: z
    .object({
      port: networkPortContract.optional(),
    })
    .optional(),
});

export type ProjectConfig = z.infer<typeof projectConfigContract>;
