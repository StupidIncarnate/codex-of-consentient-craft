/**
 * PURPOSE: A flow graph stores sign-offs scattered across nodes, edges, and a flow-level off-map
 * array, so nothing in the graph itself is a list a measurement can iterate. Every digest in this
 * package that counts or crosses sign-offs needs them flattened into one comparable shape first —
 * this is that shape, produced by `quest-to-units` and consumed by `quest-to-coverage`.
 *
 * `trackVerdicts` holds an OPTIONAL verdict per track rather than a boolean, because
 * `trackCoverageContract` must reconcile `confirmed + unconfirmable === signed`, and a boolean can
 * only say a track signed — never which verdict it carried. A track's key being ABSENT means that
 * track has not signed this unit; PRESENT means it has, holding the verdict itself. "Signed" thus
 * becomes "the key is present", so the confirmed/unconfirmable counts fall straight out of which
 * value each present key holds, with no separate boolean to keep in sync alongside it.
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
