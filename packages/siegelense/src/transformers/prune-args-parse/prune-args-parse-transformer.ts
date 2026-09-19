/**
 * PURPOSE: Reads `dungeonmaster siegelense prune`'s argv into a `PruneArgs` — the three selectors
 * kebab-cased from the spec's own field names (`--instance`, `--kind`, `--older-than`), plus
 * `--json`/`--human`. `--older-than` DEFAULTS to `pruneStatics.window.defaultOlderThan` rather than
 * to no window at all: this is the one call in the tool that deletes files, and "take everything"
 * may not be what a caller gets for typing the call name alone. The window is validated here, at the
 * argv edge, so `prune --older-than 7` is refused before any directory is read rather than after.
 * Reach for this over parsing inside the responder: the flow's route table hands argv to a
 * transformer for every other call, and a refusal has to be a clean sentence rather than a ZodError.
 *
 * USAGE:
 * pruneArgsParseTransformer({ args: ['--kind', 'video', '--older-than', '2d'] });
 * // Returns { query: { instanceId: null, kind: 'video', olderThan: '2d' }, human: true }
 */

import { elapsedTextContract } from '../../contracts/elapsed-text/elapsed-text-contract';
import { instanceIdContract } from '../../contracts/instance-id/instance-id-contract';
import { pruneArgsContract } from '../../contracts/prune-args/prune-args-contract';
import type { PruneArgs } from '../../contracts/prune-args/prune-args-contract';
import { pruneAssetKindContract } from '../../contracts/prune-asset-kind/prune-asset-kind-contract';
import { pruneStatics } from '../../statics/prune/prune-statics';
import { siegelenseOutputStatics } from '../../statics/siegelense-output/siegelense-output-statics';
import { flagContractParseTransformer } from '../flag-contract-parse/flag-contract-parse-transformer';
import { flagValueReadTransformer } from '../flag-value-read/flag-value-read-transformer';
import { pruneOlderThanParseTransformer } from '../prune-older-than-parse/prune-older-than-parse-transformer';

const INSTANCE_FLAG = '--instance';
const KIND_FLAG = '--kind';
const OLDER_THAN_FLAG = '--older-than';

const VALUE_FLAGS = [INSTANCE_FLAG, KIND_FLAG, OLDER_THAN_FLAG];
const KNOWN_FLAGS = [...VALUE_FLAGS, siegelenseOutputStatics.flags.json];
const USAGE =
  'Usage: dungeonmaster siegelense prune [--instance <instanceId>] [--kind <kind>] ' +
  '[--older-than <window>] [--json]';

export const pruneArgsParseTransformer = ({ args }: { args: readonly string[] }): PruneArgs => {
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

  const instanceValue = flagValueReadTransformer({ args, flag: INSTANCE_FLAG });
  const kindValue = flagValueReadTransformer({ args, flag: KIND_FLAG });
  const olderThanValue = flagValueReadTransformer({ args, flag: OLDER_THAN_FLAG });

  const olderThan = flagContractParseTransformer({
    flag: OLDER_THAN_FLAG,
    parse: () => elapsedTextContract.parse(olderThanValue ?? pruneStatics.window.defaultOlderThan),
  });

  // Parsed for its refusal, not its value: a window this cannot read must be answered at the argv
  // edge, before any directory is listed and long before any file is unlinked.
  pruneOlderThanParseTransformer({ olderThan });

  return pruneArgsContract.parse({
    query: {
      instanceId:
        instanceValue === null
          ? null
          : flagContractParseTransformer({
              flag: INSTANCE_FLAG,
              parse: () => instanceIdContract.parse(instanceValue),
            }),
      kind:
        kindValue === null
          ? null
          : flagContractParseTransformer({
              flag: KIND_FLAG,
              parse: () => pruneAssetKindContract.parse(kindValue),
            }),
      olderThan,
    },
    human: !args.includes(siegelenseOutputStatics.flags.json),
  });
};
