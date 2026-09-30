/**
 * PURPOSE: JSON value schema for a parsed, camelCased, and XML-inflated Claude JSONL line
 *
 * USAGE:
 * const line = normalizedLineContract.parse(rawObject);
 * // Returns the NormalizedLine JSON value — accepted by downstream processors via `unknown` parameter
 */

import { z } from '#gateway/npm/zod';

export const normalizedLineContract = z.json();

export type NormalizedLine = z.infer<typeof normalizedLineContract>;
