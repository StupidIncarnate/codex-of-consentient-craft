/**
 * PURPOSE: The `subagent` ingredient — one sub-agent transcript beside a session, linked to the
 * Task tool use that spawned it. NAMED `subagent-ingredient-broker.ts`, NOT
 * `subagent-ingredient.ts` — see `guild-ingredient-broker.ts`'s own header for the naming finding
 * this repeats.
 *
 * `links` carries the `from:` ruling TWICE: `{ of: 'session', as: 'sessionId', from: 'sessionId' }`
 * reads the parent session's own id field (which is `sessionId`, not `id`), and
 * `{ of: 'guild', as: 'cwd', from: 'path' }` reads the guild's `path` — the same pair the session
 * ingredient carries, because a sub-agent's transcript directory is encoded the same way its
 * parent session's is.
 *
 * `copies: 'claude-mock/bin/claude'` shares the session ingredient's own finding — see
 * `session-ingredient-broker.ts`'s own header for why this string and not an in-repo broker name.
 *
 * `defaults` mints `agentId`, `toolUseId`, `taskDescription` and `completed: true`. `taskPrompt`,
 * `lines`, `sessionId` and `cwd` have no honest default: the first two carry no meaningful stand-in
 * content, and the last two arrive through `links`.
 *
 * USAGE:
 * const dm = registry({ guilds, sessions: sessionIngredientBroker, subagents: subagentIngredientBroker });
 * dm.guilds.add(1, (g) => [g[0].sessions.add(1, (s) => [
 *   s[0].subagents.add(1, (a) => [a[0].set({ lines: ['...'] })]),
 * ])]);
 */
import { agentIdContract } from '@dungeonmaster/shared/contracts';

import { recipesHydrationCreateBroker } from '../../recipes-hydration/create/recipes-hydration-create-broker';
import { subagentFieldsContract } from '../../../contracts/subagent-fields/subagent-fields-contract';
import { subagentRecordContract } from '../../../contracts/subagent-record/subagent-record-contract';
import { taskDescriptionContract } from '../../../contracts/task-description/task-description-contract';
import { toolUseIdContract } from '../../../contracts/tool-use-id/tool-use-id-contract';
import { subagentQueryRouteBroker } from '../query-route/subagent-query-route-broker';
import { subagentRemoveRouteBroker } from '../remove-route/subagent-remove-route-broker';
import { subagentWriteRouteBroker } from '../write-route/subagent-write-route-broker';
import type { SubagentFields } from '../../../contracts/subagent-fields/subagent-fields-contract';

const { ingredient } = recipesHydrationCreateBroker();

export const subagentIngredientBroker = ingredient({
  name: 'subagent',
  description:
    'one sub-agent transcript beside a session, linked to the Task tool use that spawned it',
  fields: subagentFieldsContract,
  record: subagentRecordContract,
  links: [
    { of: 'session', as: 'sessionId', from: 'sessionId' },
    { of: 'guild', as: 'cwd', from: 'path' },
  ],
  defaults: (index: number): Partial<SubagentFields> => ({
    agentId: agentIdContract.parse(`seed-agent-${index + 1}`),
    toolUseId: toolUseIdContract.parse(`toolu_seed${index + 1}`),
    taskDescription: taskDescriptionContract.parse(`Seeded task ${index + 1}`),
    completed: true,
  }),
  routes: {
    write: subagentWriteRouteBroker,
    query: subagentQueryRouteBroker,
    remove: subagentRemoveRouteBroker,
  },
  copies: 'claude-mock/bin/claude',
});
