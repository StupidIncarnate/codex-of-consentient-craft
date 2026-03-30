/**
 * PURPOSE: Defines computed token annotation data that pairs with a MergedChatItem for display
 *
 * USAGE:
 * tokenAnnotationContract.parse({tokenBadgeLabel: null, resultTokenBadgeLabel: null, cumulativeContext: null, contextDelta: null, source: 'session'});
 * // Returns validated TokenAnnotation object
 */

import { z } from 'zod';

import { contextTokenCountContract } from '../context-token-count/context-token-count-contract';
import { contextTokenDeltaContract } from '../context-token-delta/context-token-delta-contract';
import { formattedTokenLabelContract } from '../formatted-token-label/formatted-token-label-contract';

export const tokenAnnotationContract = z.object({
  tokenBadgeLabel: formattedTokenLabelContract.nullable(),
  resultTokenBadgeLabel: formattedTokenLabelContract.nullable(),
  cumulativeContext: contextTokenCountContract.nullable(),
  contextDelta: contextTokenDeltaContract.nullable(),
  source: z.enum(['session', 'subagent']),
});

export type TokenAnnotation = z.infer<typeof tokenAnnotationContract>;
