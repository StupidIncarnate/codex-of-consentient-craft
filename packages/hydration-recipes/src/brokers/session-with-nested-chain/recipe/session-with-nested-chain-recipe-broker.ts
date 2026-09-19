/**
 * PURPOSE: The `session-with-nested-chain` recipe — one session under an existing guild, holding
 * a nested sub-agent chain. Part 5's own worked example of a recipe declaring `inputs`, so it can
 * stack on what an earlier step made, proved against a real guild rather than left as a doc
 * snippet.
 *
 * The specification's own worked example declares `inputs: { guildId }` and calls
 * `dm.sessions.under({ guildId })`. THIS repo's session ingredient does not link that way:
 * `session-ingredient-broker.ts` declares `links: [{ of: 'guild', as: 'cwd', from: 'path' }]`, so
 * the field `.under()` must supply is `cwd`, not `guildId`, and the value it needs is the guild's
 * own `path`, not its `id`. So this recipe's declared input is `guildPath` — a finding for
 * `scrolls/seigelense/siegelense-recipes.md`, beside the worked example it diverges from.
 *
 * USAGE:
 * const plan = sessionWithNestedChainRecipeBroker({ guildPath: someGuildRecord.path });
 * const result = await dmRegistryBroker.run(plan, target);
 * // result.nested is the SessionRecord `withNestedChain` acted on
 */
import { absoluteFilePathContract, streamJsonLineContract } from '@dungeonmaster/shared/contracts';

import { nestedChainArgsContract } from '../../../contracts/nested-chain-args/nested-chain-args-contract';
import { sessionWithNestedChainInputsContract } from '../../../contracts/session-with-nested-chain-inputs/session-with-nested-chain-inputs-contract';
import { sessionWithNestedChainStatics } from '../../../statics/session-with-nested-chain/session-with-nested-chain-statics';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesHydrationCreateBroker } from '../../recipes-hydration/create/recipes-hydration-create-broker';

const { recipe } = recipesHydrationCreateBroker();

export const sessionWithNestedChainRecipeBroker = recipe(
  {
    name: 'session-with-nested-chain',
    description: 'one session under an existing guild, holding a nested sub-agent chain',
    inputs: sessionWithNestedChainInputsContract,
  },
  ({ guildPath }) => [
    // `guildPath` arrives branded `GuildPath` (matching a real guild record); the session
    // ingredient's own `cwd` field is the distinct `AbsoluteFilePath` brand, so it is re-parsed
    // here rather than cast — a guild's own `path` is always absolute once `guildWriteRouteBroker`
    // has derived it.
    dmRegistryBroker.sessions
      .under({ cwd: absoluteFilePathContract.parse(guildPath) })
      .add(1, (s) => [
        s[0].set({ lines: [streamJsonLineContract.parse('{"type":"init"}')] }),
        s[0].withNestedChain({
          depth: nestedChainArgsContract.shape.depth.parse(
            sessionWithNestedChainStatics.counts.depth,
          ),
        }),
        s[0].saveRecordAs({ name: 'nested' }),
      ]),
  ],
);
