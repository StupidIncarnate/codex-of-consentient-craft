/**
 * PURPOSE: The parsed argv for `dungeonmaster siegelense start` — the spec to boot, and which
 * quest/guild the instance belongs to. `questId` and `guildId` are `.nullable()`, never
 * `.optional()`, because `startArgsParseTransformer` always decides a value for them — `null` when
 * `--quest`/`--guild` was never typed — and a reader of this shape must never see "was this field
 * left unset by the parser" as a live question. Reach for this over `siegelenseStartInputContract`:
 * that one validated the deleted MCP tool's JSON body, this one validates argv the transformer has
 * already normalised.
 *
 * USAGE:
 * startArgsContract.parse({ specName: 'dungeonmaster-web', questId: null, guildId: null });
 * // Returns a validated StartArgs for the unowned case
 */

import { z } from 'zod';

import { guildIdContract, questIdContract } from '@dungeonmaster/shared/contracts';

import { specNameContract } from '../spec-name/spec-name-contract';

export const startArgsContract = z
  .object({
    specName: specNameContract,
    questId: questIdContract.nullable(),
    guildId: guildIdContract.nullable(),
  })
  .strict();

export type StartArgs = z.infer<typeof startArgsContract>;
