/**
 * PURPOSE: Defines a branded union type for CSS dimension values (number px or string like '100%')
 *
 * USAGE:
 * cssDimensionContract.parse('100%');
 * // Returns: CssDimension branded value
 */

import { z } from 'zod';

export const cssDimensionContract = z.union([z.number(), z.string()]).brand<'CssDimension'>();

export type CssDimension = z.infer<typeof cssDimensionContract>;
