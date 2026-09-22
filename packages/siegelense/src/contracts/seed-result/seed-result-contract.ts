/**
 * PURPOSE: The records a recipe produces when run — one entry per `saveRecordAs` name a recipe's
 * plan declared, keyed by ContentText. A value is EITHER a bare ContentText id (the
 * `{binding.field}` placeholder syntax still reads a flat id straight off some bindings) OR a
 * record of that saved row's own fields — `dmRegistryBroker.run` (`@dungeonmaster/hydration`'s
 * `HydrationRunResult`) hands back the FULL saved row (a Guild, a Quest, …) under each name, not a
 * flattened id, and `recipeSeedRunBroker` parses that raw producer output through this contract
 * directly. Reach for this over a flat `Record<ContentText, ContentText>`: `{binding.field}`
 * resolves a binding's FIELD (`step-interpolate-transformer.ts`), which only means something when a
 * binding's value is an object with fields.
 *
 * USAGE:
 * seedResultContract.parse({ guild: { id: 'g1', urlSlug: 'siege-guild' } });
 * // Returns the parsed record of saved rows
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

export const seedResultContract = z.record(
  contentTextContract,
  z.union([contentTextContract, z.record(contentTextContract, z.unknown())]),
);

export type SeedResult = z.infer<typeof seedResultContract>;
