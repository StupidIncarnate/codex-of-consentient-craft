/**
 * PURPOSE: The two ways an ingredient can make its row — `api`, `write` — each carrying a
 * different risk. Reach for this over inventing a third spelling of "how a row gets made"
 * anywhere else; `hydrationRoutesContract` is the object keyed by these two names.
 *
 * Left unbranded, deliberately: zod's `.brand()` wraps a schema in `ZodBranded`, which drops the
 * `.options` accessor `ZodEnum` carries, and `it.each` over the valid set needs that accessor to
 * avoid hardcoding the two names a second time.
 *
 * USAGE:
 * hydrationRouteContract.parse('api');
 * // Returns 'api' | 'write'
 */
import { z } from 'zod';

export const hydrationRouteContract = z.enum(['api', 'write']);

export type HydrationRoute = z.infer<typeof hydrationRouteContract>;
