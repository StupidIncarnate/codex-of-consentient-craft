/**
 * PURPOSE: The `operation` ingredient — one item on a quest's operations ledger, at whatever
 * status you set it to. Named `operation-ingredient-broker.ts`, not `operation-ingredient.ts` —
 * see `guild-ingredient-broker.ts`'s own header for the naming finding this repeats.
 *
 * It links to BOTH `quest` and `guild`, which is what puts its accessor on a quest row and not on
 * a guild row — a guild alone cannot supply a `questId`.
 *
 * `transitions` is DELIBERATELY ABSENT, and unlike quest's, THIS absence is not staged to be
 * filled later by a known future broker: no group in this chunk's build order ever creates an
 * `operationReachRouteBroker`, and this ingredient's own route table (`write`, `query`, `update`,
 * `remove` — no `reach`) never named one either. Every operation-status change this chunk's tests
 * exercise arrives already-set through `defaults`/`set` at create time, or through the QUEST's
 * `in_progress` transition minting rows directly — never through a caller walking an operation's
 * OWN status field. This is reported as a finding, not silently resolved.
 *
 * It has no `api` route: `operations` is off the modify-quest allowlist entirely, at every
 * status — no agent writes the ledger anywhere, so there is no HTTP surface to record through.
 * `copies: 'questOperationsUpdateBroker'` names the broker every route's effect imitates;
 * `questOperationsUpdateBroker` itself is unreachable from this package for the same reason
 * `questPersistBroker` is — see `operation-write-route-broker.ts`'s own header.
 *
 * `fields: operationFieldsSchemaContract`, not `operationFieldsContract` directly — see that file's
 * own header for why: `ingredient()` checks a concrete `ZodObject` against two independently-
 * inferred phantom-carrier sites, which fails for any shape holding enum/branded fields unless the
 * value handed to `fields` is upcast to `z.ZodType<OperationFields>` first. `defaults` below still
 * reads `operationFieldsContract.shape.<field>` — the upcast export drops `.shape`, so `defaults`
 * keeps the concrete contract.
 *
 * USAGE:
 * const dm = registry({ guilds: guildIngredientBroker, quests: questIngredientBroker, operations: operationIngredientBroker });
 * dm.guilds.add(1, (g) => [g[0].quests.add(1, (q) => [q[0].operations.add(1, (o) => [o[0].set({ role: 'ward' })])])]);
 */
import { operationItemContract } from '@dungeonmaster/shared/contracts';

import { recipesHydrationCreateBroker } from '../../recipes-hydration/create/recipes-hydration-create-broker';
import { operationFieldsContract } from '../../../contracts/operation-fields/operation-fields-contract';
import { operationFieldsSchemaContract } from '../../../contracts/operation-fields-schema/operation-fields-schema-contract';
import { operationQueryRouteBroker } from '../query-route/operation-query-route-broker';
import { operationRemoveRouteBroker } from '../remove-route/operation-remove-route-broker';
import { operationUpdateRouteBroker } from '../update-route/operation-update-route-broker';
import { operationWriteRouteBroker } from '../write-route/operation-write-route-broker';
import type { OperationFields } from '../../../contracts/operation-fields/operation-fields-contract';

const { ingredient } = recipesHydrationCreateBroker();

export const operationIngredientBroker = ingredient({
  name: 'operation',
  description: "one item on a quest's operations ledger, at whatever status you set it to",
  fields: operationFieldsSchemaContract,
  record: operationItemContract,
  links: [
    { of: 'quest', as: 'questId' },
    { of: 'guild', as: 'guildId' },
  ],
  defaults: (index: number): Partial<OperationFields> => ({
    text: operationFieldsContract.shape.text.parse(`Seeded operation ${index + 1}`),
    role: 'codeweaver',
    status: 'pending',
  }),
  routes: {
    write: operationWriteRouteBroker,
    query: operationQueryRouteBroker,
    update: operationUpdateRouteBroker,
    remove: operationRemoveRouteBroker,
  },
  copies: 'questOperationsUpdateBroker',
});
