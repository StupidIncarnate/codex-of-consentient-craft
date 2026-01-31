/**
 * PURPOSE: Defines a branded type for warning messages displayed to users
 *
 * USAGE:
 * const warning = warningMessageContract.parse('Warning: Something went wrong');
 * // Returns validated WarningMessage branded type
 */

import { z } from 'zod';

export const warningMessageContract = z.string().min(1).brand<'WarningMessage'>();

export type WarningMessage = z.infer<typeof warningMessageContract>;
