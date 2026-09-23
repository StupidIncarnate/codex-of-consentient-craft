/**
 * PURPOSE: The arguments a quest's `attachWorkItem` extra takes — everything needed to append one
 * work item except its id (minted at apply time, like `operationWriteRouteBroker` mints an
 * operation's). `operationId` is typed `OperationItemId | SavedRef` rather than a plain id: the
 * whole point of this extra is letting a recipe name the operation a SIBLING `operations.add()`
 * minted earlier in the SAME plan, whose real id is unknown until that create op runs —
 * `fromSavedRefTransformer({name, field: 'id'})` is what a recipe passes here, and
 * `fieldValuesResolveTransformer` (already wired into `opExtraApplyLayerBroker`) replaces it with
 * the real id before `apply` ever sees `args`.
 *
 * USAGE:
 * workItemAttachArgsContract.parse({
 *   role: 'codeweaver',
 *   status: 'complete',
 *   spawnerType: 'agent',
 *   createdAt: '2024-01-01T00:00:00.000Z',
 *   operationId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
 * });
 * // Returns WorkItemAttachArgs
 */
import { z } from 'zod';

import { savedRefContract } from '@dungeonmaster/hydration/contracts';
import {
  operationItemIdContract,
  spawnerTypeContract,
  workItemRoleContract,
  workItemStatusContract,
} from '@dungeonmaster/shared/contracts';

export const workItemAttachArgsContract = z.object({
  role: workItemRoleContract,
  status: workItemStatusContract,
  spawnerType: spawnerTypeContract,
  createdAt: z.string().datetime().brand<'IsoTimestamp'>(),
  operationId: z.union([operationItemIdContract, savedRefContract]),
});

export type WorkItemAttachArgs = z.infer<typeof workItemAttachArgsContract>;
