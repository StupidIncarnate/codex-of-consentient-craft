/**
 * PURPOSE: Defines a branded number type for tracking followup agent depth in orchestration
 *
 * USAGE:
 * followupDepthContract.parse(0);
 * // Returns branded FollowupDepth
 */

import { z } from 'zod';

export const followupDepthContract = z.number().int().min(0).brand<'FollowupDepth'>();

export type FollowupDepth = z.infer<typeof followupDepthContract>;
