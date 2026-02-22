/**
 * PURPOSE: Defines a branded string type for resolved binary command paths
 *
 * USAGE:
 * binCommandContract.parse('/project/node_modules/.bin/eslint');
 * // Returns: BinCommand branded string
 */

import { z } from 'zod';

export const binCommandContract = z.string().min(1).brand<'BinCommand'>();

export type BinCommand = z.infer<typeof binCommandContract>;
