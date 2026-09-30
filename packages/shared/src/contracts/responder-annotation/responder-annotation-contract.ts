/**
 * PURPOSE: Defines a per-responder/startup annotation pair — an inline suffix appended to a
 * tree line plus optional child lines indented underneath it (e.g., reverse `← packages/web`
 * pointers under an HTTP responder line).
 *
 * USAGE:
 * responderAnnotationContract.parse({
 *   suffix: '[POST /api/quests/:questId/start]',
 *   childLines: ['← packages/web (questStartBroker)'],
 * });
 * // Returns validated ResponderAnnotation
 *
 * WHEN-TO-USE: Project-map boot-tree renderer interspersing per-type metadata at responder
 * and startup nodes
 */

import { z } from '#gateway/npm/zod';

export const responderAnnotationContract = z
  .object({
    suffix: z.string().brand<'ResponderAnnotationSuffix'>().nullable(),
    childLines: z.array(z.string().brand<'ResponderAnnotationChildLines'>()),
  })
  .brand<'ResponderAnnotation'>();

export type ResponderAnnotation = z.infer<typeof responderAnnotationContract>;
