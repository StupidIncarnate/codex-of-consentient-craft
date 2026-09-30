/**
 * PURPOSE: One `results` row read back off disk or the driver, as the object a caller picks fields
 * off. Rows come from six unrelated shapes (console, network, ws, server, screenshots, steps), so
 * the values stay open; a row that is not a JSON object (an array, a bare number) reads as an empty
 * object, since there is nothing to pick a key off. Reach for this over a cast whenever a row's
 * text is decoded.
 *
 * USAGE:
 * resultRowContract.parse(JSON.parse('{"status":200}'));
 * // Returns { status: 200 }; a JSON array or number returns {}
 */

import { z } from '#gateway/npm/zod';

export const resultRowContract = z.union([
  z.record(z.string(), z.unknown()),
  z.unknown().transform((): Record<string, unknown> => ({})),
]);

export type ResultRow = z.infer<typeof resultRowContract>;
