/**
 * PURPOSE: The one flat shape every sign-off measurement in this package counts. A flow — one graph
 * of work inside a quest — records its sign-offs in three scattered places: on nodes, on edges, and
 * in a flow-level array of off-map families, the standing checks siegemaster runs outside the
 * graph. None of the three is a list a measurement can walk. So `quest-to-units` flattens all of
 * them into these units, one per signable thing, and `quest-to-coverage` counts them.
 *
 * `trackVerdicts` holds an OPTIONAL verdict per sign-off track rather than a boolean. A sign-off
 * track is one reviewing role: codeweaver, flowrider or siegemaster. The reason for a verdict is
 * that `trackCoverageContract` has to reconcile `confirmed + unconfirmable === signed`, and a
 * boolean can only say that a track signed — never which verdict it carried. An ABSENT key means
 * that track has not signed this unit. A PRESENT key means it has, and the value is the verdict.
 * "Signed" is therefore "the key is present", so the confirmed and unconfirmable counts fall
 * straight out of what the present keys hold. Nothing keeps a second boolean in step.
 *
 * USAGE:
 * verificationUnitContract.parse({
 *   flowId: 'render-images-in-transcript', flowType: 'runtime', kind: 'observable',
 *   unitId: 'check-thumbnail-renders', nodeId: 'transcript-panel', addedBy: 'siegemaster',
 *   verificationMethod: 'reading',
 *   trackVerdicts: { codeweaverSignoff: 'confirmed', siegemasterSignoff: 'unconfirmable' },
 * });
 */
import { z } from 'zod';

import { signoffVerdictContract } from '@dungeonmaster/shared/contracts';

export const verificationUnitContract = z
  .object({
    flowId: z.string(),
    flowType: z.enum(['runtime', 'operational']),
    kind: z.enum(['terminal', 'branch', 'observable', 'off-map']),
    unitId: z.string(),
    nodeId: z.string().optional(),
    packages: z.array(z.string()).default([]),
    addedBy: z
      .enum(['spec', 'chaoswhisperer', 'codeweaver', 'flowrider', 'siegemaster', 'operator'])
      .optional(),
    verificationMethod: z.enum(['test', 'reading']).default('test'),
    trackVerdicts: z.object({
      codeweaverSignoff: signoffVerdictContract.optional(),
      flowriderSignoff: signoffVerdictContract.optional(),
      siegemasterSignoff: signoffVerdictContract.optional(),
    }),
  })
  .brand<'VerificationUnit'>();

export type VerificationUnit = z.infer<typeof verificationUnitContract>;
