/**
 * PURPOSE: The field names that make a modify-quest element a SIGN-OFF WRITE, and the only keys such
 * an element is allowed to carry alongside one
 *
 * USAGE:
 * signoffPatchFieldsStatics.signoffFields;
 * // Returns the two field names whose presence marks an element as carrying a sign-off
 * signoffPatchFieldsStatics.allowedOnSigningElement;
 * // Returns every key an observable / edge / off-map entry may carry once it signs
 * signoffPatchFieldsStatics.allowedOnSigningNode;
 * // Same, plus `observables` — a container, not content of the node being signed
 *
 * A sign-off is EVIDENCE about a unit as it stands, so an element that writes one may write nothing
 * else about itself: `id` to address it, and the sign-off fields. Anything more would let one call
 * sign an observable and rewrite the assertion it just signed.
 *
 * `observables` stays allowed on a signing NODE because every observable inside is held to this same
 * allowlist at its own level, so nothing can change unseen — and that batched shape (`{id,
 * flowriderSignoff, observables: [...]}`) is what a `reviewer-minion` writes: its discipline pack
 * tells it to sign a whole slice in ONE modify-quest call rather than one call per unit.
 * `nodes` needs no equivalent entry: a flow carries no sign-off fields at all.
 *
 * Field NAMES rather than a track map: the reader is a key-presence check over a payload element,
 * not a per-track lookup. `signoffTrackEligibilityStatics` owns the per-track question.
 */

export const signoffPatchFieldsStatics = {
  signoffFields: ['flowriderSignoff', 'siegemasterSignoff'],
  allowedOnSigningElement: ['id', 'flowriderSignoff', 'siegemasterSignoff'],
  allowedOnSigningNode: ['id', 'flowriderSignoff', 'siegemasterSignoff', 'observables'],
} as const;
