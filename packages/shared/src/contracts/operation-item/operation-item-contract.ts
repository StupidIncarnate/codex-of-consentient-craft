/**
 * PURPOSE: One durable entry on the quest operations ledger — the ordered plan/status record that drives dispatch
 *
 * USAGE:
 * operationItemContract.parse({id: 'f47ac10b-...', role: 'codeweaver', text: 'core: config adapter', status: 'pending'});
 * // Returns: OperationItem object
 *
 * The ledger has exactly ONE writer: the orchestrator. `operations` is off the modify-quest
 * allowlist entirely, at every quest status — ChaosWhisperer never authors it, and no execution
 * agent ever writes it either. Its content comes from `questBuildRelayGraphBroker`, which derives it
 * at Start Quest from the flow nodes' `packages` tags and the contracts' `source` paths, and from
 * runtime mutation via `questOperationsUpdateBroker`. There is no `partial` status: an
 * `operationStatus: 'partial'` outcome on signal-back marks the item `complete` and appends a
 * "pt N: {text}" continuation item, keeping the strict 1:1 operation-item↔work-item invariant and an
 * immutable pt audit trail.
 */

import { z } from 'zod';

import { flowIdContract } from '../flow-id/flow-id-contract';
import { operationItemIdContract } from '../operation-item-id/operation-item-id-contract';
import { packageNameContract } from '../package-name/package-name-contract';
import { workItemRoleContract } from '../work-item-role/work-item-role-contract';

export const operationItemContract = z.object({
  id: operationItemIdContract,
  role: workItemRoleContract,
  text: z
    .string()
    .min(1)
    .brand<'OperationText'>()
    .describe('Prose description of the operation. Continuations are auto-named "pt N: {text}"'),
  status: z.enum(['pending', 'in_progress', 'complete']),
  locked: z
    .boolean()
    .default(false)
    .describe(
      'Orchestrator/Chaos-owned items (the plan item and the fixed verify tail) that cannot be deleted via modify-quest',
    ),
  wardMode: z
    .enum(['changed', 'full'])
    .optional()
    .describe('Only on role:ward items — which ward invocation the run-ward work item executes'),
  flowIds: z
    .array(flowIdContract)
    .default([])
    .describe(
      'The quest flows this item lands on, so a session knows where on the spine it is working. ' +
        'For most roles this is a NON-BINDING pointer and not a permission boundary — the flows ' +
        'are the acceptance target for the whole quest and every session reads all of them. An ' +
        'item whose whole scope is contracts legitimately carries none, and one flow may ' +
        'be referenced by several items when its layers are built in separate sessions. The three ' +
        'sign-off-writing roles read it harder. On a `codeweaver`, `flowrider` or `siegemaster` ' +
        'item this list IS its COVERAGE SCOPE: `get-qa-checklist` enumerates the units on exactly ' +
        'these flows, so they are the ones this item owns, and an item declaring none owns no flow ' +
        'unit at all. On a `flowrider` item the list is the RUNTIME flows only — an operational ' +
        "flow is verified by hand-checking its final state, which is Siegemaster's question.",
    ),
  packageNames: z
    .array(packageNameContract)
    .default([])
    .describe(
      'The packages this item lands in, each one an entry in `quest.packagesAffected`. On an ' +
        'implementation item it BINDS nothing: it is a pre-work declaration that orders the ' +
        'ledger dependencies-first and tells the session which packages to read before it ' +
        'searches, and a session that has to touch a package it did not declare still may — the ' +
        'same non-binding reading `flowIds` carries for most roles. On a verification item it IS ' +
        "the COVERAGE SLICE, routed by the unit's owning NODE and never by an observable — " +
        'terminal and branch units have no observable to read a package from. A verification item ' +
        'is one FLOW, so the names are the packages that flow touches and the item owns every ' +
        'unit whose node tags any of them, glue included. An item declaring none is scoped to ' +
        'the whole quest and is never narrowed by this field.',
    ),
});

export type OperationItem = z.infer<typeof operationItemContract>;
