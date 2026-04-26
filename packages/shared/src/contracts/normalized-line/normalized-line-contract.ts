/**
 * PURPOSE: Branded unknown type representing a parsed, camelCased, and XML-inflated Claude JSONL line
 *
 * USAGE:
 * const line = normalizedLineContract.parse(rawObject);
 * // Returns branded NormalizedLine — accepted by downstream processors via `unknown` parameter
 */

import { z } from 'zod';

export const normalizedLineContract = z.unknown().brand<'NormalizedLine'>();

export type NormalizedLine = z.infer<typeof normalizedLineContract>;
