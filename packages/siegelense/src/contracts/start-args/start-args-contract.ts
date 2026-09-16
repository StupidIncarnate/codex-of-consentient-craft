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
 * startArgsContract.parse({ specName: 'dungeonmaster-web', questId: null, guildId: null });
 * // Returns a validated StartArgs for the unowned case, with the default idle ceiling
 *
 * startArgsContract.parse({
 *   specName: 'dungeonmaster-web',
 *   questId: null,
 *   guildId: null,
 *   idleTimeoutMs: 1_800_000,
 * });
 * // Returns a validated StartArgs carrying a raised idle ceiling
 */

import { z } from 'zod';

import {
  guildIdContract,
  questIdContract,
  timeoutMsContract,
} from '@dungeonmaster/shared/contracts';

import { specNameContract } from '../spec-name/spec-name-contract';

export const startArgsContract = z
  .object({
    specName: specNameContract,
    questId: questIdContract.nullable(),
    guildId: guildIdContract.nullable(),
    idleTimeoutMs: timeoutMsContract.optional(),
  })
  .strict();

export type StartArgs = z.infer<typeof startArgsContract>;
