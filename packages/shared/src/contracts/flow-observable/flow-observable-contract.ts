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
 * A DECLARED STYLE VALUE takes the flag for the second reason rather than the first: the assertion
 * reaches it and reads nothing. "Renders at font size 9 in `text-dim`" is settled by
 * `toHaveCSS('font-size', '9px')`, which reads back the literal the source sets — green the day it
 * is written, red on the next restyle, and blind to every defect in between. Unflagged, that
 * observable is a change-detector test nobody downstream can refuse: `flowrider` and `siegemaster`
 * are each told a `(read-check)` unit belongs to another track and everything else is theirs, so an
 * author who leaves the flag off has committed all three tracks to writing one.
 *
 * A PAINTED OUTCOME is the opposite and carries no flag. Clipping, overlap, an off-screen control
 * and unreadable contrast are things the source never states, so a real browser is the only place
 * they are true or false — and those stay testable on purpose, because siegemaster is told to treat
 * a misaligned control or a truncated label as a defect. The question that separates the two is
 * whether the statement could break with no user-visible change.
 *
 * `verifyByHuman` exists for the criterion neither of those settles: one no automated check — test
 * or reading — can reach at all, because it names a judgment only a person can make, and only once
 * the quest is done. It sits on a separate axis from `verifyByReading` and composes with it freely:
 * one says how a criterion is settled, the other says the checker cannot be a machine, so an
 * observable may carry either, both, or neither. Any role may set it, including one with no way to
 * confirm the criterion itself.
 *
 * It is `.optional()` because `questModifyBroker` re-parses the whole quest on every write, so a
 * `.default(false)` would materialise onto every observable in the file — true of `verifyByReading`
 * and `verifyByHuman` alike. Absent means an automated check settles it.
 */

import { z } from 'zod';

import { observableIdContract } from '../observable-id/observable-id-contract';
import { observableOriginContract } from '../observable-origin/observable-origin-contract';
import { outcomeTypeContract } from '../outcome-type/outcome-type-contract';
import { packageNameContract } from '../package-name/package-name-contract';

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
      'Set true when the criterion is about the shape of a source file — an import that must exist, a literal that must not be inlined, a name that must be absent, a style value that must be the one declared — so it is settled by reading the code rather than by running a test. Absent means a test settles it, which is the right answer for every outcome a user perceives, painted geometry included.',
    ),
  verifyByHuman: z
    .boolean()
    .optional()
    .describe(
      'Set true when no automated check — no test, no reading — can settle the criterion at all: only a person can judge it, and only after the quest is done. Setting it drops the criterion from the observable list every other role works from, so from that point on nothing else in the quest is asked to satisfy it. Any role may set this, including one with no way to verify the criterion itself. Absent means an automated check settles it.',
    ),
  addedBy: observableOriginContract.default('spec'),
});

export type FlowObservable = z.infer<typeof flowObservableContract>;
