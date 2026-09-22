/**
 * PURPOSE: The field names that make a modify-quest element a SIGN-OFF WRITE, and the only keys such
 * an element is allowed to carry alongside one
 *
 * USAGE:
 * signoffPatchFieldsStatics.signoffFields;
 * // Returns the field names whose presence marks an element as carrying a sign-off (empty now that sign-off fields are retired)
 * signoffPatchFieldsStatics.allowedOnSigningElement;
 * // Returns every key an observable / edge may carry once it signs
 * signoffPatchFieldsStatics.allowedOnSigningNode;
 * // Same, plus `observables` — a container, not content of the node being signed
 *
 * A sign-off is EVIDENCE about a unit as it stands, so an element that writes one may write nothing
 * else about itself: `id` to address it, and the sign-off fields. Anything more would let one call
 * sign an observable and rewrite the assertion it just signed — and the session that authors an
 * artifact is the session that signs it, so nothing else stands between the two.
 * `questSignoffCoupledEditViolationsTransformer` is the reader that refuses it.
 *
 * `observables` stays allowed on a signing NODE because every observable inside is held to this same
 * allowlist at its own level, so nothing can change unseen.
 * `nodes` needs no equivalent entry: a flow carries no sign-off fields at all.
 *
 * ALL SIGN-OFF FIELDS ARE RETIRED. The three sign-off fields (`codeweaverSignoff`,
 * `flowriderSignoff`, `siegemasterSignoff`) have been removed from verification units.
 * `signoffFields` is now empty, and the allowlists retain only `id` (and `observables` on nodes)
 * for compatibility with consumers that check modify-quest element keys.
 */
const signoffFields = [] as const;

export const signoffPatchFieldsStatics = {
  signoffFields,
  allowedOnSigningElement: ['id', ...signoffFields],
  allowedOnSigningNode: ['id', ...signoffFields, 'observables'],
} as const;
