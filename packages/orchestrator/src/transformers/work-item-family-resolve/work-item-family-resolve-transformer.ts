/**
 * PURPOSE: The family KEY an operation item belongs to — `wardFull`, `riftcarver`, `warpgate`,
 * `codeweaver`, `flowrider` or `siegemaster` — resolved off `questFlowStatics[quest.questType]`
 * rather than read off `operationItem.role` directly. `wardFull` carries `role: 'ward'`, so the
 * ledger's role is what a caller HAS and the family key is what `agentFlowStatics` is KEYED ON;
 * `nextActionTransformer` resolves it the identical way, at `next-action-transformer.ts:139-149`.
 * `quest-work`'s `invalidation` and `request` payloads both need a caller's FAMILY, never its ledger
 * role, for exactly the reason that file's own comment gives.
 *
 * USAGE:
 * workItemFamilyResolveTransformer({ quest: QuestStub(), operationItem: OperationItemStub({ role: 'siegemaster' }) });
 * // Returns 'siegemaster' as AgentFamilyName
 *
 * Returns `undefined` for a role no family carries — `spiritmender` and the chat/command roles have
 * no entry in `questFlowStatics[…].families` at all, which is a real state (those roles have no
 * sign-off track either), not a lookup failure.
 */

import type { OperationItem, Quest } from '@dungeonmaster/shared/contracts';
import { questFlowStatics } from '@dungeonmaster/shared/statics';

import { agentFamilyNameContract } from '../../contracts/agent-family-name/agent-family-name-contract';
import type { AgentFamilyName } from '../../contracts/agent-family-name/agent-family-name-contract';

export const workItemFamilyResolveTransformer = ({
  quest,
  operationItem,
}: {
  quest: Quest;
  operationItem: OperationItem;
}): AgentFamilyName | undefined => {
  const questFlow = questFlowStatics[quest.questType];

  const familyEntry = Object.entries(questFlow.families).find(
    (entry) => entry[1].role === operationItem.role,
  );

  return familyEntry === undefined ? undefined : agentFamilyNameContract.parse(familyEntry[0]);
};
