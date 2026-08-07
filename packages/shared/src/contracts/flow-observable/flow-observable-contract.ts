/**
 * PURPOSE: Defines the FlowObservable structure for outcome-based acceptance criteria embedded in flow nodes
 *
 * USAGE:
 * flowObservableContract.parse({id: 'login-redirects', type: 'ui-state', description: 'redirects to dashboard'});
 * // Returns: FlowObservable object
 *
 * `addedBy` records provenance and uses `.default('spec')`, not `.optional()`. Readers count
 * per-track coverage over every observable and must never branch on a missing origin, so the field
 * has to be non-optional on the output type. `spec` — in the flow at approval — is the truthful
 * origin for every observable a quest file already carries, and a REQUIRED field with no default
 * would make each persisted quest.json fail at `questContract.parse`.
 *
 * `flowriderSignoff` and `siegemasterSignoff` are TOP-LEVEL SIBLING fields, deliberately not a
 * nested `signoffs: {flowrider, siegemaster}` block. `questItemDeepMergeTransformer` recurses only
 * into arrays of id-bearing objects and replaces every other object value WHOLESALE, so a nested
 * block written by Siegemaster would delete Flowrider's sign-off while the write still reports
 * `success: true`. As sibling keys the merge is a per-key overwrite, which is exactly the semantics
 * two independent tracks need: each writes its own field and neither can clobber the other.
 *
 * Both sign-offs are `.optional()` rather than `.default()`. `questModifyBroker` re-parses the whole
 * quest on every write, so a default materialises into the persisted JSON for every observable in
 * the file — measured at +116% file size on a real quest with zero sign-offs written. An absent
 * field means unsigned.
 */

import { z } from 'zod';

import { observableIdContract } from '../observable-id/observable-id-contract';
import { observableOriginContract } from '../observable-origin/observable-origin-contract';
import { outcomeTypeContract } from '../outcome-type/outcome-type-contract';
import { signoffContract } from '../signoff/signoff-contract';

export const flowObservableContract = z.object({
  id: observableIdContract,
  type: outcomeTypeContract,
  description: z.string().brand<'OutcomeDescription'>(),
  designRef: z.string().brand<'DesignRef'>().optional(),
  addedBy: observableOriginContract.default('spec'),
  flowriderSignoff: signoffContract.optional(),
  siegemasterSignoff: signoffContract.optional(),
});

export type FlowObservable = z.infer<typeof flowObservableContract>;
