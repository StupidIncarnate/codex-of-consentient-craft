/**
 * PURPOSE: Defines the structured output of formatting tool input JSON into displayable fields
 *
 * USAGE:
 * formattedToolInputContract.parse({fields: [{key: 'command', value: 'ls -la', isLong: false}]});
 * // Returns validated FormattedToolInput object
 */

import { z } from 'zod';

const formattedToolFieldContract = z.object({
  key: z.string().min(1).brand<'ToolFieldKey'>(),
  value: z.string().brand<'ToolFieldValue'>(),
  isLong: z.boolean(),
});

export type FormattedToolField = z.infer<typeof formattedToolFieldContract>;

export const formattedToolInputContract = z.object({
  fields: z.array(formattedToolFieldContract),
});

export type FormattedToolInput = z.infer<typeof formattedToolInputContract>;
