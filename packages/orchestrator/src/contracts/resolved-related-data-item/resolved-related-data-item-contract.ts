/**
 * PURPOSE: Defines the result types for the resolve-related-data-item transformer
 *
 * USAGE:
 * const resolved: ResolvedItem = resolveRelatedDataItemTransformer({ ref, quest });
 * // Returns { collection: 'steps', id, item } or { collection: 'wardResults', id, item }
 */

import { z } from 'zod';

import {
  dependencyStepContract,
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
]);

export type ResolvedItem = z.infer<typeof resolvedRelatedDataItemContract>;
