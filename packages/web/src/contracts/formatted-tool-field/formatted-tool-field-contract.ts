/**
 * PURPOSE: One argument of a tool call, already formatted for display — its key, its value, and
 * whether it is long enough to need elision. Split out from `formattedToolInputContract` so a widget
 * rendering ONE field can take this whole shape as a single prop rather than picking properties off
 * the array it came from.
 *
 * USAGE:
 * formattedToolFieldContract.parse({key: 'command', value: 'ls -la', isLong: false});
 * // Returns a branded FormattedToolField
 */

import { z } from '#gateway/npm/zod';

export const formattedToolFieldContract = z
  .object({
    key: z.string().min(1).brand<'FormattedToolFieldKey'>(),
    value: z.string().brand<'FormattedToolFieldValue'>(),
    isLong: z.boolean(),
  })
  .brand<'FormattedToolField'>();

export type FormattedToolField = z.infer<typeof formattedToolFieldContract>;
