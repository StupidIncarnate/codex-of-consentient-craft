/**
 * PURPOSE: Defines the result types for the resolve-related-data-item transformer
 *
 * USAGE:
 * const resolved: ResolvedItem = resolveRelatedDataItemTransformer({ ref, quest });
 * // Returns { collection: 'steps', id, item }, { collection: 'wardResults', id, item }, or { collection: 'flows', id, item }
 */

import { z } from 'zod';

import {
  dependencyStepContract,
  flowContract,
  flowIdContract,
  stepIdContract,
  wardResultContract,
} from '@dungeonmaster/shared/contracts';

export const resolvedRelatedDataItemContract = z.discriminatedUnion('collection', [
  z.object({
    collection: z.literal('steps'),
    id: stepIdContract,
    item: dependencyStepContract,
  }),
  z.object({
    collection: z.literal('wardResults'),
    id: wardResultContract.shape.id,
    item: wardResultContract,
  }),
  z.object({
    collection: z.literal('flows'),
    id: flowIdContract,
    item: flowContract,
  }),
]);

export type ResolvedItem = z.infer<typeof resolvedRelatedDataItemContract>;
