/**
 * PURPOSE: Defines the FlowObservable structure for outcome-based acceptance criteria embedded in flow nodes
 *
 * USAGE:
 * flowObservableContract.parse({id: 'login-redirects', type: 'ui-state', description: 'redirects to dashboard', package: 'auth-service'});
 * // Returns: FlowObservable object
 *
 * `addedBy` records provenance and uses `.default('spec')`, not `.optional()`. Readers count
 * per-track coverage over every observable and must never branch on a missing origin, so the field
 * has to be non-optional on the output type. `spec` — in the flow at approval — is the truthful
 * origin for every observable a quest file already carries, and a REQUIRED field with no default
 * would make each persisted quest.json fail at `questContract.parse`.
 *
 * `codeweaverSignoff`, `flowriderSignoff` and `siegemasterSignoff` are TOP-LEVEL SIBLING fields,
 * deliberately not a nested `signoffs: {codeweaver, flowrider, siegemaster}` block.
 * `questItemDeepMergeTransformer` recurses only into arrays of id-bearing objects and replaces every
 * other object value WHOLESALE, so a nested block written by Siegemaster would delete Flowrider's
 * sign-off while the write still reports `success: true`. As sibling keys the merge is a per-key
 * overwrite, which is exactly the semantics independent tracks need: each writes its own field and
 * none can clobber another.
 *
 * Every sign-off is `.optional()` rather than `.default()`. `questModifyBroker` re-parses the whole
 * quest on every write, so a default materialises into the persisted JSON for every observable in
 * the file — measured at +116% file size on a real quest with zero sign-offs written. An absent
 * field means unsigned.
 *
 * `package` is REQUIRED here and `.optional()` on `modifyQuestInputContract`. The asymmetry is the
 * resolve-on-save rule: an observable on a node tagged with exactly one package has that package
 * written through for it, so an author never restates what the node already says; on a node tagged
 * with more than one there is nothing to inherit, and the omission is rejected rather than guessed.
 * Every observable on disk therefore names its own side of a seam.
 *
 * `verifyByReading` exists because some acceptance criteria are about the SHAPE OF A SOURCE FILE and
 * no test can reach them. "The consumer imports this value instead of hardcoding it" is true or false
 * by opening the file; a passing test proves the value is right, never where it came from. Without a
 * mark for that, an author with such a criterion either drops it or writes it as though a test settles
 * it, and the session that inherits it burns a round finding out it cannot. `type` is a SEPARATE axis
 * and stays what it is — that field says what kind of outcome this is, this one says how it gets
 * settled.
 *
 * It is `.optional()` for the same reason every sign-off is: `questModifyBroker` re-parses the whole
 * quest on every write, so a `.default(false)` would materialise onto every observable in the file.
 * Absent means a test settles it.
 */

import { z } from 'zod';

import { observableIdContract } from '../observable-id/observable-id-contract';
import { observableOriginContract } from '../observable-origin/observable-origin-contract';
import { outcomeTypeContract } from '../outcome-type/outcome-type-contract';
import { packageNameContract } from '../package-name/package-name-contract';
import { signoffContract } from '../signoff/signoff-contract';

export const flowObservableContract = z.object({
  id: observableIdContract,
  type: outcomeTypeContract,
  description: z.string().brand<'OutcomeDescription'>(),
  package: packageNameContract.describe(
    "The one package this observable is read in, drawn from the owning node's tags. Singular where the node's is plural: a node spans a seam, an individual observable sits on one side of it, and the union of a node's observables' packages is what proves both sides were asserted.",
  ),
  designRef: z.string().brand<'DesignRef'>().optional(),
  verifyByReading: z
    .boolean()
    .optional()
    .describe(
      'Set true when the criterion is about the shape of a source file — an import that must exist, a literal that must not be inlined, a name that must be absent — so it is settled by reading the code rather than by running a test. Absent means a test settles it.',
    ),
  addedBy: observableOriginContract.default('spec'),
  codeweaverSignoff: signoffContract.optional(),
  flowriderSignoff: signoffContract.optional(),
  siegemasterSignoff: signoffContract.optional(),
});

export type FlowObservable = z.infer<typeof flowObservableContract>;
