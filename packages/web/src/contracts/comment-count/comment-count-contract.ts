/**
 * PURPOSE: Defines a branded number type for counting the comments anchored to a flow box
 *
 * USAGE:
 * commentCountContract.parse(2);
 * // Returns: CommentCount branded number
 */

import { z } from 'zod';

export const commentCountContract = z.number().int().min(0).brand<'CommentCount'>();

export type CommentCount = z.infer<typeof commentCountContract>;
