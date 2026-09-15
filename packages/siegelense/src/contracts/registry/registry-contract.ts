/**
 * PURPOSE: The whole `registry.json` file — one entry per instance, alive or gone. An EMPTY registry
 * (`{ instances: [] }`) is a real answer, never an error: a fresh `<home>/.dungeonmaster/siegelense/`
 * tree with nothing yet started must parse exactly like a populated one, because `capacity` and
 * `start` read this file on every call and neither may treat "nothing running" as a load failure.
 *
 * USAGE:
 * const registry = registryContract.parse({ instances: [] });
 * // Returns a validated Registry
 */

import { z } from 'zod';

import { registryEntryContract } from '../registry-entry/registry-entry-contract';

export const registryContract = z.object({
  instances: z.array(registryEntryContract).readonly(),
});

export type Registry = z.infer<typeof registryContract>;
