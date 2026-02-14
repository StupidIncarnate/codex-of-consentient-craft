/**
 * PURPOSE: Defines a branded string type for CSS font-family values
 *
 * USAGE:
 * const font: CssFontFamily = cssFontFamilyContract.parse('monospace');
 * // Returns a branded CssFontFamily string type
 */
import { z } from 'zod';

export const cssFontFamilyContract = z.string().min(1).brand<'CssFontFamily'>();

export type CssFontFamily = z.infer<typeof cssFontFamilyContract>;
