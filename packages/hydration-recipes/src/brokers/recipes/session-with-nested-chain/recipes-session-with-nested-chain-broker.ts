/**
 * PURPOSE: The `session-with-nested-chain` recipe — one session under an existing guild, holding
 * a nested sub-agent chain. Reach for this over other recipes when testing nested Claude session
 * transcript chains under an existing guild.
 *
 * USAGE:
 * const plan = recipesSessionWithNestedChainBroker({ guildPath: someGuildRecord.path });
 * const result = await dmRegistryBroker.run(plan, target);
 */

import { absoluteFilePathContract, streamJsonLineContract } from '@dungeonmaster/shared/contracts';

import { nestedChainArgsContract } from '../../../contracts/nested-chain-args/nested-chain-args-contract';
import { sessionWithNestedChainInputsContract } from '../../../contracts/session-with-nested-chain-inputs/session-with-nested-chain-inputs-contract';
import { sessionWithNestedChainStatics } from '../../../statics/session-with-nested-chain/session-with-nested-chain-statics';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesHydrationCreateBroker } from '../../recipes-hydration/create/recipes-hydration-create-broker';

const { recipe } = recipesHydrationCreateBroker();

export const recipesSessionWithNestedChainBroker = recipe(
  {
    name: 'session-with-nested-chain',
    description: 'one session under an existing guild, holding a nested sub-agent chain',
    inputs: sessionWithNestedChainInputsContract,
  },
  ({ guildPath }) => [
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
