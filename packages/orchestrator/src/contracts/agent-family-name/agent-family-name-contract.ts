/**
 * PURPOSE: A family KEY into `agentFlowStatics` — `codeweaver`, `flowrider`, `siegemaster`,
 * `wardFull`, `riftcarver` or `warpgate` — distinct from `operationItem.role` (`workItemRoleContract`
 * in `@dungeonmaster/shared`): `wardFull` carries `role: 'ward'`, so the ledger's role is what a
 * caller HAS and this is what `agentFlowStatics` is KEYED ON. Free-form rather than a closed enum
 * for the same reason `stepNameContract` is: families are DATA (`questFlowStatics`), not a fixed set
 * this package pins at the type level.
 *
 * USAGE:
 * agentFamilyNameContract.parse('siegemaster');
 * // Returns: AgentFamilyName
 */

import { z } from 'zod';

export const agentFamilyNameContract = z.string().min(1).brand<'AgentFamilyName'>();

export type AgentFamilyName = z.infer<typeof agentFamilyNameContract>;
