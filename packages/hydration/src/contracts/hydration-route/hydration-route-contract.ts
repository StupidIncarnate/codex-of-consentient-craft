/**
 * PURPOSE: The three ways an ingredient can make its row — `api`, `write`, `recording` — each
 * carrying a different risk. Reach for this over inventing a fourth spelling of "how a row gets
 * made" anywhere else; `hydrationRoutesContract` is the object keyed by these three names.
 *
 * Left unbranded, deliberately: zod's `.brand()` wraps a schema in `ZodBranded`, which drops the
 * `.options` accessor `ZodEnum` carries, and `it.each` over the valid set needs that accessor to
 * avoid hardcoding the three names a second time.
 *
 * USAGE:
 * hydrationRouteContract.parse('api');
 * // Returns 'api' | 'write' | 'recording'
 */
import { z } from 'zod';

export const hydrationRouteContract = z.enum(['api', 'write', 'recording']);

export type HydrationRoute = z.infer<typeof hydrationRouteContract>;
