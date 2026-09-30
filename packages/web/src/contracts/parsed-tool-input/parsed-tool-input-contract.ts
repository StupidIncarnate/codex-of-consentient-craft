/**
 * PURPOSE: Defines the shape of a parsed JSON tool input object as a record of unknown values keyed by plain strings
 *
 * USAGE:
 * parsedToolInputContract.parse(JSON.parse(rawJson));
 * // Returns ParsedToolInput — a Record<string, unknown>
 */

import { z } from '#gateway/npm/zod';

export const parsedToolInputContract = z.record(z.string(), z.json());

export type ParsedToolInput = z.infer<typeof parsedToolInputContract>;
