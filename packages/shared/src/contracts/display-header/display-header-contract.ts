/**
 * PURPOSE: Defines a branded string type for quest status display headers
 *
 * USAGE:
 * const header: DisplayHeader = displayHeaderContract.parse('IN PROGRESS');
 * // Returns a branded DisplayHeader string
 */

import { z } from 'zod';

export const displayHeaderContract = z.string().brand<'DisplayHeader'>();

export type DisplayHeader = z.infer<typeof displayHeaderContract>;
