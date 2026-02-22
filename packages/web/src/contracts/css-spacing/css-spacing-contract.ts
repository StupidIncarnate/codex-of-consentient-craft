/**
 * PURPOSE: Defines a branded number type for CSS spacing values in pixels
 *
 * USAGE:
 * cssSpacingContract.parse(8);
 * // Returns: CssSpacing branded number
 */

import { z } from 'zod';

export const cssSpacingContract = z.number().brand<'CssSpacing'>();

export type CssSpacing = z.infer<typeof cssSpacingContract>;
