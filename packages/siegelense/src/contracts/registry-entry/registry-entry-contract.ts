/**
 * PURPOSE: One row of `registry.json` — id, owner, quest, pid, pgids, socketPath, specHash, ports,
 * state and lastBeat (spec line 134), the whole on-disk record for one instance, alive or gone.
 * Every field that can be absent is `.nullable()`, never `.optional()`: the row round-trips through
 * `JSON.stringify`, and under this repo's `exactOptionalPropertyTypes` an absent key and an explicit
 * `null` key are different values, so `.optional()` would let the in-memory shape and the on-disk
 * shape drift apart. A RESERVED instance is a row with `pid: null`, `bootedAtMs: null` and
 * `socketPath: null` — not a sixth `InstanceState` member, because the five members of
 * `InstanceState` are the closed set `results` answers with (spec lines 2175-2181), and `capacity`
 * still counts a reservation because a reserved row is already sitting in this registry. A driver
 * has not booted a socket for a reservation, so `socketPath` is null exactly when `pid` is — it is
 * how a `kill` from a different OS process finds the driver to talk to once one exists.
 * `questId`/`guildId` are both null for an `unowned/` instance. A reaped or pruned row is a
 * TOMBSTONE — `state: 'pruned'` with `prunedAtMs` and `prunedByRule` both set, and `socketPath`
 * cleared back to null because the driver behind it is gone — so what is gone answers as gone,
 * never as an empty list (spec line 1666); `start` records the quest id, and that recorded id is how
 * `prune` and `cleanup` later resolve "still referenced" (spec line 1668).
 *
 * USAGE:
 * const entry = registryEntryContract.parse({
 *   id: 'inst_7f3a9c21',
 *   owner: '42781',
 *   questId: null,
 *   guildId: null,
 *   specName: 'dungeonmaster-web',
 *   specHash: 'a3f9c2e1',
 *   pid: null,
 *   pgids: [],
 *   socketPath: null,
 *   ports: { api: 34172, web: 34173 },
 *   state: 'alive',
 *   reservedAtMs: 1700000000000,
 *   bootedAtMs: null,
 *   lastBeatMs: null,
 *   prunedAtMs: null,
 *   prunedByRule: null,
 * });
 * // Returns a validated RegistryEntry
 */

import { z } from 'zod';

import {
  absoluteFilePathContract,
  contentTextContract,
  guildIdContract,
  processIdContract,
  questIdContract,
} from '@dungeonmaster/shared/contracts';

import { epochMsContract } from '../epoch-ms/epoch-ms-contract';
import { instanceIdContract } from '../instance-id/instance-id-contract';
import { instanceOwnerContract } from '../instance-owner/instance-owner-contract';
import { instanceStateContract } from '../instance-state/instance-state-contract';
import { portPairContract } from '../port-pair/port-pair-contract';
import { processGroupIdContract } from '../process-group-id/process-group-id-contract';
import { specHashContract } from '../spec-hash/spec-hash-contract';
import { specNameContract } from '../spec-name/spec-name-contract';

export const registryEntryContract = z.object({
  id: instanceIdContract,
  owner: instanceOwnerContract,
  questId: questIdContract.nullable(),
  guildId: guildIdContract.nullable(),
  specName: specNameContract,
  specHash: specHashContract,
  pid: processIdContract.nullable(),
  pgids: z.array(processGroupIdContract).readonly(),
  socketPath: absoluteFilePathContract.nullable(),
  ports: portPairContract,
  state: instanceStateContract,
  reservedAtMs: epochMsContract,
  bootedAtMs: epochMsContract.nullable(),
  lastBeatMs: epochMsContract.nullable(),
  prunedAtMs: epochMsContract.nullable(),
  prunedByRule: contentTextContract.nullable(),
});

export type RegistryEntry = z.infer<typeof registryEntryContract>;
