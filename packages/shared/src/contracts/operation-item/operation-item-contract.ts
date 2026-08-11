/**
 * PURPOSE: One durable entry on the quest operations ledger — the ordered plan/status record that drives dispatch
 *
 * USAGE:
 * operationItemContract.parse({id: 'f47ac10b-...', role: 'codeweaver', text: 'core: config adapter', status: 'pending'});
 * // Returns: OperationItem object
 *
 * The ledger has exactly TWO writers: ChaosWhisperer authors the plan items at spec time (via
 * modify-quest, allowlist-gated to explore_observables) and the orchestrator mutates status at
 * runtime (via questOperationsUpdateBroker). Execution agents never write it — they signal an
 * outcome and the orchestrator applies it. There is no `partial` status: an `operationStatus:
 * 'partial'` outcome on signal-back marks the item `complete` and appends a "pt N: {text}"
 * continuation item, keeping the strict 1:1 operation-item↔work-item invariant and an immutable
 * pt audit trail.
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
        'are the acceptance target for the whole quest and every session reads all of them. A ' +
        'foundational item that serves the whole spec legitimately carries none, and one flow may ' +
        'be referenced by several items when its layers are built in separate sessions. Two roles ' +
        'read it harder. On a `siegemaster` item this list IS its COVERAGE SCOPE: the signal-back ' +
        'completion gate refuses `done` while any verification unit on these flows carries no ' +
        '`siegemasterSignoff`, and an item declaring no flows is never gated. On a `flowrider` ' +
        'item the list is the RUNTIME flows only — an operational flow is verified by hand-checking ' +
        "its final state, which is Siegemaster's question — and it is ADVISORY: that gate " +
        'computes its own denominator from every runtime flow on the quest rather than from this ' +
        'list, so an item declaring none is still gated.',
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
        'terminal and branch units have no observable to read a package from. On a `flowrider` ' +
        'item the slices PARTITION the quest: an item naming ONE package owns the units whose ' +
        'node tags that package and nothing else, and the seam item, naming the union of the ' +
        'glue packages, owns the units whose node tags two or more — so every unit has exactly ' +
        'one owner and each pt budget covers a scope one session can hold. On a `groundstomper` ' +
        'item they are the browser-reachable packages of its one flow, and it owns every unit ' +
        'whose node tags any of them, glue included. An item declaring none is scoped to the ' +
        'whole quest and is never narrowed by this field.',
    ),
});

export type OperationItem = z.infer<typeof operationItemContract>;
