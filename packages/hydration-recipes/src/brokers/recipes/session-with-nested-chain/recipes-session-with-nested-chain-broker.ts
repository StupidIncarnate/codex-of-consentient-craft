/**
 * PURPOSE: The `session-with-nested-chain` recipe — one session under an existing guild, holding
 * a nested sub-agent chain TWO LEVELS deep: a top agent, and one sub-agent nested under it. Reach
 * for this over other recipes when testing nested Claude session transcript chains under an
 * existing guild.
 *
 * The depth is fixed at `sessionWithNestedChainStatics.counts.depth` (2) rather than taken as an
 * input alongside `guildPath` — two is the minimum that gives the chain's own test two distinct
 * agents to tell apart ("the first agent" vs. "the agent nested under it"), and every consumer of
 * this recipe so far has wanted exactly that shape. If a caller ever needs a different depth,
 * `nestedChainArgsContract.shape.depth` below already accepts one — widen
 * `sessionWithNestedChainInputsContract` to carry it (defaulting to this same statics value) rather
 * than hand-rolling a second recipe.
 *
 * The session's own first line is a real user turn, not a bare `{"type":"init"}` — DEF-91: the
 * chain's first Task tool_use (`sessionNestedChainBroker`'s own extra) is appended onto this SAME
 * file right after, so the file needs a real user message ahead of it for the chat replay to render
 * a turn at all, matching `session-with-nested-subagent`'s own fidelity-direct main session.
 *
 * USAGE:
 * const plan = recipesSessionWithNestedChainBroker({ guildPath: someGuildRecord.path });
 * const result = await dmRegistryBroker.run(plan, target);
 */

import { streamLineToJsonLineTransformer } from '@dungeonmaster/shared/transformers';

import { sessionFieldsContract } from '../../../contracts/session-fields/session-fields-contract';
import { nestedChainArgsContract } from '../../../contracts/nested-chain-args/nested-chain-args-contract';
import { sessionWithNestedChainInputsContract } from '../../../contracts/session-with-nested-chain-inputs/session-with-nested-chain-inputs-contract';
import { sessionWithNestedChainStatics } from '../../../statics/session-with-nested-chain/session-with-nested-chain-statics';
import { transcriptUserTextLineTransformer } from '../../../transformers/transcript-user-text-line/transcript-user-text-line-transformer';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesHydrationCreateBroker } from '../../recipes-hydration/create/recipes-hydration-create-broker';

const { recipe } = recipesHydrationCreateBroker();

export const recipesSessionWithNestedChainBroker = recipe(
  {
    name: 'session-with-nested-chain',
    description:
      'one session under an existing guild, holding a nested sub-agent chain two levels deep ' +
      '— a top agent with one sub-agent nested under it',
    inputs: sessionWithNestedChainInputsContract,
  },
  ({ guildPath }) => [
    dmRegistryBroker.sessions
      .under({ cwd: sessionFieldsContract.shape.cwd.parse(guildPath) })
      .add(1, (s) => [
        s[0].set({
          lines: sessionFieldsContract.shape.lines.parse([
            streamLineToJsonLineTransformer({
              streamLine: transcriptUserTextLineTransformer({
                text: 'Dispatch a nested sub-agent chain',
              }),
            }),
          ]),
        }),
        s[0].withNestedChain({
          depth: nestedChainArgsContract.shape.depth.parse(
            sessionWithNestedChainStatics.counts.depth,
          ),
        }),
        s[0].saveRecordAs({ name: 'nested' }),
      ]),
  ],
);
