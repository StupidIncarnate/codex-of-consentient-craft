/**
 * PURPOSE: The parsed argv for `dungeonmaster siegelense start` — the spec to boot, which
 * quest/guild the instance belongs to, and an optional raised idle ceiling for the served lane.
 * `questId` and `guildId` are `.nullable()`, never `.optional()`, because `startArgsParseTransformer`
 * always decides a value for them — `null` when `--quest`/`--guild` was never typed — and a reader of
 * this shape must never see "was this field left unset by the parser" as a live question.
 * `idleTimeoutMs` is genuinely `.optional()` instead: most starts never raise the ceiling, and the
 * key's ABSENCE — not a `null` — is what lets `SiegelenseStartResponder`/`instanceStartBroker` skip
 * appending `--idle-timeout-ms` to the spawned driver's own argv, leaving `driverStatics.idle
 * .timeoutMs` as the default the driver falls back to when it reads none. Reach for this over
 * `siegelenseStartInputContract`: that one validated the deleted MCP tool's JSON body, this one
 * validates argv the transformer has already normalised.
 *
 * USAGE:
 * startArgsContract.parse({ specName: 'dungeonmaster-stack', questId: null, guildId: null, seed: null });
 * // Returns a validated StartArgs for the unowned, unseeded case, with the default idle ceiling
 *
 * startArgsContract.parse({
 *   specName: 'dungeonmaster-stack',
 *   questId: null,
 *   guildId: null,
 *   seed: 'guild-with-three-quests',
 *   idleTimeoutMs: 1_800_000,
 * });
 * // Returns a validated StartArgs that seeds at boot and carries a raised idle ceiling
 */

import { z } from 'zod';

import {
  guildIdContract,
  questIdContract,
  timeoutMsContract,
} from '@dungeonmaster/shared/contracts';

import { recipeNameContract } from '../recipe-name/recipe-name-contract';
import { specNameContract } from '../spec-name/spec-name-contract';

export const startArgsContract = z
  .object({
    specName: specNameContract,
    questId: questIdContract.nullable(),
    guildId: guildIdContract.nullable(),
    // The recipe to run against the new lane once it is up, filling the manifest's `seeded`
    // (siegelense-tooling.md line 2303). `.nullable()` for the same reason questId and guildId
    // are: the parser always decides a value, so no reader ever has "was this left unset" as a
    // live question.
    seed: recipeNameContract.nullable(),
    idleTimeoutMs: timeoutMsContract.optional(),
    json: z.boolean().default(false),
  })
  .strict();

export type StartArgs = z.infer<typeof startArgsContract>;
