/**
 * PURPOSE: Defines a branded number type for scroll position pixel values (scrollTop, scrollHeight, clientHeight)
 *
 * USAGE:
 * scrollPositionPxContract.parse(500);
 * // Returns: ScrollPositionPx branded number
 */

import { z } from 'zod';

export const scrollPositionPxContract = z.number().nonnegative().brand<'ScrollPositionPx'>();

export type ScrollPositionPx = z.infer<typeof scrollPositionPxContract>;
