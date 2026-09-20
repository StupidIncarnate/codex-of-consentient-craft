/**
 * PURPOSE: The `session-single-turn` recipe — one session under an existing guild, holding a
 * single turn prompt and response. Reach for this over other recipes when testing basic session
 * creation and transcript readback.
 *
 * USAGE:
 * const plan = recipesSessionSingleTurnBroker({ guildPath: someGuildRecord.path });
 * const result = await dmRegistryBroker.run(plan, target);
 */

import { absoluteFilePathContract, streamJsonLineContract } from '@dungeonmaster/shared/contracts';

import { sessionWithNestedChainInputsContract } from '../../../contracts/session-with-nested-chain-inputs/session-with-nested-chain-inputs-contract';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesHydrationCreateBroker } from '../../recipes-hydration/create/recipes-hydration-create-broker';

const { recipe } = recipesHydrationCreateBroker();

export const recipesSessionSingleTurnBroker = recipe(
  {
    name: 'session-single-turn',
    description: 'one session under an existing guild, holding a single turn prompt and response',
    inputs: sessionWithNestedChainInputsContract,
  },
  ({ guildPath }) => [
    dmRegistryBroker.sessions
      .under({ cwd: absoluteFilePathContract.parse(guildPath) })
      .add(1, (s) => [
        s[0].set({
          lines: [
            streamJsonLineContract.parse(
              '{"type":"user","message":{"role":"user","content":"Single turn request"}}',
            ),
            streamJsonLineContract.parse(
              '{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"Single turn response"}]}}',
            ),
          ],
        }),
        s[0].saveRecordAs({ name: 'session' }),
      ]),
  ],
);
