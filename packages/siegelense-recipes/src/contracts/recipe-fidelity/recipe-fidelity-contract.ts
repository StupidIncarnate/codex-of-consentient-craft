/**
 * PURPOSE: Which of the three ways a recipe built the state it claims — derived from
 * `recipeFidelityStatics.markers.all` rather than retyped, so a fourth marker is one edit. The
 * marker is not decoration: it is the risk declaration a reader of a listing acts on, and
 * `recipeManifestContract` keys its `mirrors:` obligation off it. Reach for this over a bare string
 * anywhere a listing, a manifest or a diagnosis names how state was made; reach for `RecipeName`
 * instead when the value identifies WHICH recipe rather than how it works.
 *
 * Unbranded, like `workItemRoleContract` and `frameworkContract`: a three-member enum is already a
 * closed set, and a brand on one buys no safety while making the value unusable as a key into the
 * statics that describe it — the renderer looks up a marker's declared risk by exactly that.
 *
 * USAGE:
 * recipeFidelityContract.parse('direct');
 * // Returns 'direct' as RecipeFidelity
 */

import { z } from 'zod';

import { recipeFidelityStatics } from '../../statics/recipe-fidelity/recipe-fidelity-statics';

export const recipeFidelityContract = z.enum(recipeFidelityStatics.markers.all);

export type RecipeFidelity = z.infer<typeof recipeFidelityContract>;
