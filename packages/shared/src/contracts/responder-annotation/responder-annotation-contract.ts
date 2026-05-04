/**
 * PURPOSE: Defines a per-responder/startup annotation pair — an inline suffix appended to a
 * tree line plus optional child lines indented underneath it (e.g., reverse `← packages/web`
 * pointers under an HTTP responder line).
 *
 * USAGE:
 * responderAnnotationContract.parse({
 *   suffix: contentTextContract.parse('[POST /api/quests/:questId/start]'),
 *   childLines: [contentTextContract.parse('← packages/web (questStartBroker)')],
 * });
 * // Returns validated ResponderAnnotation
 *
 * WHEN-TO-USE: Project-map boot-tree renderer interspersing per-type metadata at responder
 * and startup nodes
 */

import { z } from 'zod';
import { contentTextContract } from '../content-text/content-text-contract';

export const responderAnnotationContract = z.object({
  suffix: contentTextContract.nullable(),
  childLines: z.array(contentTextContract),
});

export type ResponderAnnotation = z.infer<typeof responderAnnotationContract>;
