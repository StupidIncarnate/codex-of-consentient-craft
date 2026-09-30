/**
 * PURPOSE: Defines computed token annotation data that pairs with a MergedChatItem for display
 *
 * USAGE:
 * tokenAnnotationContract.parse({tokenBadgeLabel: null, resultTokenBadgeLabel: null, cumulativeContext: null, contextDelta: null, source: 'session'});
 * // Returns validated TokenAnnotation object
 */

import { z } from '#gateway/npm/zod';

import { contextTokenDeltaContract } from '../context-token-delta/context-token-delta-contract';

export const tokenAnnotationContract = z.object({
  tokenBadgeLabel: z.string().min(1).brand<'TokenAnnotationTokenBadgeLabel'>().nullable(),
  resultTokenBadgeLabel: z.string().min(1).brand<'TokenAnnotationResultTokenBadgeLabel'>().nullable(),
  cumulativeContext: z.number().int().nonnegative().brand<'TokenAnnotationCumulativeContext'>().nullable(),
  contextDelta: contextTokenDeltaContract.nullable(),
  source: z.enum(['session', 'subagent']),
});

export type TokenAnnotation = z.infer<typeof tokenAnnotationContract>;
