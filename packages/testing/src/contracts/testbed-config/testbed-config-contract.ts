/**
 * PURPOSE: Lets a testbed round-trip whatever config it wrote to disk during install-flow
 * integration testing. Reach for this over `@dungeonmaster/config`'s `dungeonmasterConfigContract`
 * when the caller is a testbed helper rather than a real project — the two are deliberately
 * disjoint shapes with no shared consumer.
 *
 * USAGE:
 * testbedConfigContract.parse({questFolder: 'quest', wardCommands: {}});
 * // Returns validated TestbedConfig with branded types
 */

import { z } from 'zod';

export const testbedConfigContract = z
  .object({
    questFolder: z.string().brand<'QuestFolder'>(),
    wardCommands: z.record(z.unknown()),
  })
  .passthrough();

export type TestbedConfig = z.infer<typeof testbedConfigContract>;
