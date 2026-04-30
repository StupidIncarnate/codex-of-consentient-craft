/**
 * PURPOSE: Defines the shape of a floor group produced by the work-items-to-floor-groups transformer
 *
 * USAGE:
 * floorGroupContract.parse({floorName, floorNumber: 1, workItems: [...]});
 * // Returns: FloorGroup branded object
 */

import { z } from 'zod';

import { workItemContract } from '@dungeonmaster/shared/contracts';

import { floorGroupKeyContract } from '../floor-group-key/floor-group-key-contract';
import { floorNameContract } from '../floor-name/floor-name-contract';
import { floorNumberContract } from '../floor-number/floor-number-contract';

export const floorGroupContract = z.object({
  key: floorGroupKeyContract,
  floorName: floorNameContract,
  floorNumber: floorNumberContract.nullable(),
  workItems: z.array(workItemContract),
});

export type FloorGroup = z.infer<typeof floorGroupContract>;
