/**
 * PURPOSE: Reads `dungeonmaster siegelense start`'s argv into a `StartArgs` — `--spec` required,
 * `--quest` and `--guild` each `null` when the caller never typed them, which is the documented
 * unowned case (siegelense-tooling.md line 2251), never a defect this throws on. `--idle-timeout-ms`
 * is the ONE flag this file OMITS from the returned object rather than defaulting to `null`, when
 * absent — see `startArgsContract`'s own header for why that key's absence, not a null value, is
 * what lets the ceiling stay unraised. `--json` is also accepted and contributes no field, the same
 * no-op affirmation of the default every other siegelense call takes. Delegates every flag's own
 * value-reading refusal (missing value, a value that starts with "--", a repeated flag) to
 * `flagValueReadTransformer`, and every flag's own contract-parse refusal (a bad spec name, quest id,
 * or guild id) to `flagContractParseTransformer`; `--idle-timeout-ms`'s own refusal (non-numeric, or
 * below `0`) goes through `numericFlagParseTransformer` instead, since it turns its raw text into a
 * number with `Number()` before `timeoutMsContract` ever sees it, and that contract given
 * `Number('abc')` never sees "abc" — it sees NaN. This file owns only the vocabulary — which flags
 * exist, which one is required, and what an unrecognised token means. A missing `--spec` names the
 * known specs off the same `laneSpecConventionStatics` `laneSpecFindBroker`'s own unknown-spec
 * refusal reads, never hard-coded here.
 *
 * `--idle-timeout-ms` also refuses a value BELOW `driverStatics.idle.timeoutMs` — `--help`'s own
 * line for this flag says it "raises this instance's idle ceiling above" that default, and a value
 * under it would LOWER the ceiling instead, the opposite of what the flag documents. The bound is
 * checked in the SAME `numericFlagParseTransformer` call as the rest of this flag's own parsing
 * (`timeoutMsContract.refine`), so a too-low value gets the identical
 * `--idle-timeout-ms must be <accepts>; got "<raw>"` wording every other numeric flag refusal uses.
 *
 * USAGE:
 * startArgsParseTransformer({ args: ['--spec', 'dungeonmaster-stack'] });
 * // Returns StartArgs { specName: 'dungeonmaster-stack', questId: null, guildId: null, seed: null }
 *
 * startArgsParseTransformer({ args: ['--spec', 'dungeonmaster-stack', '--seed', 'guild-with-three-quests'] });
 * // Returns StartArgs whose `seed` names the recipe to run once the lane is up
 */

import { timeoutMsContract, questContract, guildContract } from '@dungeonmaster/shared/contracts';

import { recipeNameContract } from '../../contracts/recipe-name/recipe-name-contract';
import { specNameContract } from '../../contracts/spec-name/spec-name-contract';
import { startArgsContract } from '../../contracts/start-args/start-args-contract';
import type { StartArgs } from '../../contracts/start-args/start-args-contract';
import { driverStatics } from '../../statics/driver/driver-statics';
import { laneSpecConventionStatics } from '../../statics/lane-spec-convention/lane-spec-convention-statics';
import { siegelenseOutputStatics } from '../../statics/siegelense-output/siegelense-output-statics';
import { flagContractParseTransformer } from '../flag-contract-parse/flag-contract-parse-transformer';
import { flagValueReadTransformer } from '../flag-value-read/flag-value-read-transformer';
import { numericFlagParseTransformer } from '../numeric-flag-parse/numeric-flag-parse-transformer';

const SPEC_FLAG = '--spec';
const QUEST_FLAG = '--quest';
const GUILD_FLAG = '--guild';
const IDLE_TIMEOUT_MS_FLAG = '--idle-timeout-ms';
const SEED_FLAG = '--seed';

const VALUE_FLAGS = [SPEC_FLAG, QUEST_FLAG, GUILD_FLAG, IDLE_TIMEOUT_MS_FLAG, SEED_FLAG];
const KNOWN_FLAGS = [...VALUE_FLAGS, siegelenseOutputStatics.flags.json];
const USAGE =
  'Usage: dungeonmaster siegelense start --spec <specName> [--quest <questId>] [--guild <guildId>] [--seed <recipeName>] [--idle-timeout-ms <ms>] [--json]';

export const startArgsParseTransformer = ({ args }: { args: readonly string[] }): StartArgs => {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg !== undefined && VALUE_FLAGS.includes(arg)) {
      // A following token that looks like a flag is not this flag's value — leave it for the
      // next iteration, so a missing value is refused naming THIS flag, never a token further on.
      const nextToken = args[i + 1];
      if (nextToken !== undefined && !nextToken.startsWith('--')) {
        i++;
      }
      continue;
    }

    if (arg === siegelenseOutputStatics.flags.json) {
      continue;
    }

    if (arg?.startsWith('--')) {
      throw new Error(
        `Unknown flag: ${arg}\n\nAccepted flags: ${KNOWN_FLAGS.join(', ')}\n\n${USAGE}`,
      );
    }

    throw new Error(
      `Unexpected positional argument: ${arg}\n\n` +
        `Every value must directly follow the flag it belongs to.\n\n${USAGE}`,
    );
  }

  const specValue = flagValueReadTransformer({ args, flag: SPEC_FLAG });
  if (specValue === null) {
    throw new Error(
      `${SPEC_FLAG} is required: name the lane spec to boot. ` +
        `Known specs: ${laneSpecConventionStatics.browsered}, ${laneSpecConventionStatics.headless}.`,
    );
  }
  // Checked here rather than left to specNameContract's own `.min(1)` — that path answers with the
  // contract's raw Zod issue text ("String must contain at least 1 character(s)") under the flag's
  // name, which names the RULE rather than what the caller should type. `.min(1)` is the ONLY way
  // specNameContract can fail, so this check covers its entire failure surface.
  if (specValue === '') {
    throw new Error(
      `${SPEC_FLAG} must name a lane spec; got "". ` +
        `Known specs: ${laneSpecConventionStatics.browsered}, ${laneSpecConventionStatics.headless}.`,
    );
  }

  const questValue = flagValueReadTransformer({ args, flag: QUEST_FLAG });
  const guildValue = flagValueReadTransformer({ args, flag: GUILD_FLAG });
  const idleTimeoutValue = flagValueReadTransformer({ args, flag: IDLE_TIMEOUT_MS_FLAG });
  const seedValue = flagValueReadTransformer({ args, flag: SEED_FLAG });

  return startArgsContract.parse({
    specName: flagContractParseTransformer({
      flag: SPEC_FLAG,
      parse: () => specNameContract.parse(specValue),
    }),
    questId:
      questValue === null
        ? null
        : flagContractParseTransformer({
            flag: QUEST_FLAG,
            parse: () => questContract.shape.id.parse(questValue),
          }),
    guildId:
      guildValue === null
        ? null
        : flagContractParseTransformer({
            flag: GUILD_FLAG,
            parse: () => guildContract.shape.id.parse(guildValue),
          }),
    // `null` rather than omitted, unlike --idle-timeout-ms below: an absent --seed is a decision
    // the parser MAKES (this instance seeds nothing), not a key whose absence changes a default.
    seed:
      seedValue === null
        ? null
        : flagContractParseTransformer({
            flag: SEED_FLAG,
            parse: () => recipeNameContract.parse(seedValue),
          }),
    // Omitted entirely, never set to null, when absent — startArgsContract's own header says why
    // the KEY'S absence is what leaves the served lane's idle ceiling at driverStatics.idle.timeoutMs.
    ...(idleTimeoutValue === null
      ? {}
      : {
          idleTimeoutMs: numericFlagParseTransformer({
            flag: IDLE_TIMEOUT_MS_FLAG,
            raw: idleTimeoutValue,
            accepts: `a whole number of ${driverStatics.idle.timeoutMs} (the default) or more — this flag only raises the ceiling`,
            parse: (value) =>
              timeoutMsContract
                .refine((parsed) => parsed >= driverStatics.idle.timeoutMs)
                .parse(value),
          }),
        }),
    isJson: args.includes(siegelenseOutputStatics.flags.json),
  });
};
