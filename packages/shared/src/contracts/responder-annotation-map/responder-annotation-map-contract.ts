/**
 * PURPOSE: Map keyed by absolute file path (responder file or startup file) to a
 * ResponderAnnotation, used by the boot-tree renderer to look up per-type metadata for
 * each tree node.
 *
 * USAGE:
 * const map = responderAnnotationMapContract.parse(new Map([
 *   [filePath, { suffix: '[POST /api/x]', childLines: [] }],
 * ]));
 * // Returns Map<string, ResponderAnnotation>
 *
 * WHEN-TO-USE: Threading per-package annotation lookups through the boot-tree call chain
 */

import { z } from '#gateway/npm/zod';
import { responderAnnotationContract } from '../responder-annotation/responder-annotation-contract';

export const responderAnnotationMapContract = z.map(z.string(), responderAnnotationContract);

export type ResponderAnnotationMap = z.infer<typeof responderAnnotationMapContract>;
