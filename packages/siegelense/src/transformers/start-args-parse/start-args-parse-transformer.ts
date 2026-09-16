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
 * guild id, or a non-numeric/negative ceiling) to `flagContractParseTransformer`, so this file owns
 * only the vocabulary — which flags exist, which one is required, and what an unrecognised token
 * means.
 *
 * USAGE:
 * startArgsParseTransformer({ args: ['--spec', 'dungeonmaster-web'] });
 * // Returns StartArgs { specName: 'dungeonmaster-web', questId: null, guildId: null }
 *
 * startArgsParseTransformer({ args: ['--spec', 'dungeonmaster-web', '--idle-timeout-ms', '1800000'] });
 * // Returns StartArgs { specName: 'dungeonmaster-web', questId: null, guildId: null, idleTimeoutMs: 1_800_000 }
 */

import {
  guildIdContract,
  questIdContract,
  timeoutMsContract,
} from '@dungeonmaster/shared/contracts';

import { specNameContract } from '../../contracts/spec-name/spec-name-contract';
import { startArgsContract } from '../../contracts/start-args/start-args-contract';
import type { StartArgs } from '../../contracts/start-args/start-args-contract';
import { siegelenseOutputStatics } from '../../statics/siegelense-output/siegelense-output-statics';
import { flagContractParseTransformer } from '../flag-contract-parse/flag-contract-parse-transformer';
import { flagValueReadTransformer } from '../flag-value-read/flag-value-read-transformer';

const SPEC_FLAG = '--spec';
const QUEST_FLAG = '--quest';
const GUILD_FLAG = '--guild';
const IDLE_TIMEOUT_MS_FLAG = '--idle-timeout-ms';

const VALUE_FLAGS = [SPEC_FLAG, QUEST_FLAG, GUILD_FLAG, IDLE_TIMEOUT_MS_FLAG];
const KNOWN_FLAGS = [...VALUE_FLAGS, siegelenseOutputStatics.flags.json];
const USAGE =
  'Usage: dungeonmaster siegelense start --spec <specName> [--quest <questId>] [--guild <guildId>] [--idle-timeout-ms <ms>] [--json]';

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
    throw new Error(`${SPEC_FLAG} is required: name the lane spec to boot.`);
  }

  const questValue = flagValueReadTransformer({ args, flag: QUEST_FLAG });
  const guildValue = flagValueReadTransformer({ args, flag: GUILD_FLAG });
  const idleTimeoutValue = flagValueReadTransformer({ args, flag: IDLE_TIMEOUT_MS_FLAG });

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
            parse: () => questIdContract.parse(questValue),
          }),
    guildId:
      guildValue === null
        ? null
        : flagContractParseTransformer({
            flag: GUILD_FLAG,
            parse: () => guildIdContract.parse(guildValue),
          }),
    // Omitted entirely, never set to null, when absent — startArgsContract's own header says why
    // the KEY'S absence is what leaves the served lane's idle ceiling at driverStatics.idle.timeoutMs.
    ...(idleTimeoutValue === null
      ? {}
      : {
          idleTimeoutMs: flagContractParseTransformer({
            flag: IDLE_TIMEOUT_MS_FLAG,
            parse: () => timeoutMsContract.parse(Number(idleTimeoutValue)),
          }),
        }),
  });
};
