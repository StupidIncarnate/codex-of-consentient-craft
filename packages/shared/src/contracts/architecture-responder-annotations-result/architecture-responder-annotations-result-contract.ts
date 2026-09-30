/**
 * PURPOSE: Defines the data `architectureResponderAnnotationsBroker` returns
 *
 * USAGE:
 * architectureResponderAnnotationsResultContract.parse(value);
 * // Returns validated ArchitectureResponderAnnotationsResult
 */
import { z } from '#gateway/npm/zod';
import { responderAnnotationMapContract } from '../responder-annotation-map/responder-annotation-map-contract';

export const architectureResponderAnnotationsResultContract = z
  .object({
    responderAnnotations: responderAnnotationMapContract,
    startupAnnotations: responderAnnotationMapContract,
  })
  .brand<'ArchitectureResponderAnnotationsResult'>();

export type ArchitectureResponderAnnotationsResult = z.infer<
  typeof architectureResponderAnnotationsResultContract
>;
