/**
 * PURPOSE: Defines a branded string type for CSS color override values
 *
 * USAGE:
 * cssColorOverrideContract.parse('#ff6b35');
 * // Returns: CssColorOverride branded string
 */

import { z } from 'zod';

export const cssColorOverrideContract = z.string().min(1).brand<'CssColorOverride'>();

export type CssColorOverride = z.infer<typeof cssColorOverrideContract>;
