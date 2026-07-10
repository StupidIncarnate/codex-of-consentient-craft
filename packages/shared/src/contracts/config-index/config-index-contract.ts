/**
 * PURPOSE: Defines a branded non-negative integer for position index in floor config array
 *
 * USAGE:
 * configIndexContract.parse(3);
 * // Returns: ConfigIndex branded number
 */

import { z } from 'zod';

export const configIndexContract = z.number().int().nonnegative().brand<'ConfigIndex'>();

export type ConfigIndex = z.infer<typeof configIndexContract>;
