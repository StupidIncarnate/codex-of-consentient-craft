/**
 * PURPOSE: The one shared explanation of `verifyByHuman`, written once and interpolated into every
 * prompt that authors observables (ChaosWhisperer, BugHunt) and every prompt that walks a running
 * system looking for what no automated check can settle (both siege walkers). Reach for this over
 * repeating the rule in a fifth place; a question specific to one of those prompts belongs in that
 * prompt instead.
 *
 * USAGE:
 * observableAutomatabilityStatics.markdown;
 * // The verifyByHuman rule, ready to interpolate into an authoring or walking prompt
 *
 * SELF-CONTAINED ON PURPOSE. A session reading this block has not necessarily read
 * `flowObservableContract`'s own JSDoc, so the axis this flag lives on, the composition rule with
 * `verifyByReading`, and the consequence of setting it are all restated here rather than assumed.
 */

export const observableAutomatabilityStatics = {
  markdown: `## \`verifyByHuman\`

Set \`verifyByHuman: true\` on an observable when NO automated check — no test, no reading of the source —
can settle it at all, because it names a judgment only a person can make, and only once the quest is done.

**Any role may set it, including one with no way to confirm the criterion itself.** A session that
recognizes a criterion nothing available to it can verify sets the flag rather than inventing a proxy
measurement to stand in for it.

**It is a separate axis from \`verifyByReading\`, and the two compose.** \`verifyByReading\` says a criterion
is settled by opening a file instead of running a test — a person or a model can still confirm it today,
during the quest. \`verifyByHuman\` says nothing automated can confirm it AT ALL, by either method, and not
until the quest is done. When an observable carries both, \`verifyByHuman\` wins: nothing is asked to settle
it during the quest, whatever \`verifyByReading\` also claims.

**Reach for it only when no automated check could ever settle the criterion** — not "this is hard to test"
and not "nobody has written the test yet". A criterion a person could read the source and confirm belongs to
\`verifyByReading\`. A criterion a test could assert once written belongs to a test. \`verifyByHuman\` is for
the remainder: whether a transition feels smooth, whether a tone reads right, whether a judgment call was
the correct one — each measured against the SYSTEM RUNNING for real, not against a diff or a screenshot, so
nothing before the quest ends could possibly confirm it.

**Setting it removes the observable from every role's list, from that point forward.** No codeweaver,
flowrider or siegemaster session is handed that criterion to prove once it is set — it drops out of the
in-scope units every one of them works from, whichever session sets it and whenever in the quest it sets it.
The observable is not deleted and not abandoned: it reaches a person as a question once the quest is done,
answerable only by looking at the real thing.`,
} as const;
