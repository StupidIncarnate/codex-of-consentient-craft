/**
 * PURPOSE: Defines the structured output of formatting tool input JSON into displayable fields
 *
 * USAGE:
 * formattedToolInputContract.parse({fields: [{key: 'command', value: 'ls -la', isLong: false}]});
 * // Returns validated FormattedToolInput object
 */

import { z } from 'zod';

import { formattedToolFieldContract } from '../formatted-tool-field/formatted-tool-field-contract';

export const formattedToolInputContract = z.object({
  fields: z.array(formattedToolFieldContract),
});

export type FormattedToolInput = z.infer<typeof formattedToolInputContract>;
