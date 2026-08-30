/**
 * PURPOSE: The field names that make a modify-quest element a SIGN-OFF WRITE, and the only keys such
 * an element is allowed to carry alongside one
 *
 * USAGE:
 * signoffPatchFieldsStatics.signoffFields;
 * // Returns the field names whose presence marks an element as carrying a sign-off
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
 * allowlist at its own level, so nothing can change unseen — and that batched shape (`{id,
 * flowriderSignoff, observables: [...]}`) is what a reviewer writes: its discipline pack
 * tells it to sign a whole slice in ONE modify-quest call rather than one call per unit.
 * `nodes` needs no equivalent entry: a flow carries no sign-off fields at all.
 *
 * ALL THREE LISTS ARE DERIVED FROM `signoffTracksStatics.fields` rather than spelled out, so a
 * fourth track is marked as signing AND allowed on a signing element the day it is declared there.
 * Hardcoded, a track this file had not heard of would have its own sign-off refused as the
 * offending key — the exact inversion of what the allowlist is for.
 *
 * Field NAMES rather than a track map: the reader is a key-presence check over a payload element,
 * not a per-track lookup. `signoffTrackEligibilityStatics` owns the per-track question.
 */
import { signoffTracksStatics } from '@dungeonmaster/shared/statics';

const signoffFields = signoffTracksStatics.fields.map((track) => `${track}Signoff`);

export const signoffPatchFieldsStatics = {
  signoffFields,
  allowedOnSigningElement: ['id', ...signoffFields],
  allowedOnSigningNode: ['id', ...signoffFields, 'observables'],
} as const;
