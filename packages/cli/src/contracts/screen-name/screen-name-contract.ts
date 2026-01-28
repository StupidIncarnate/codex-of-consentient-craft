/**
 * PURPOSE: Defines a branded string type for screen names in debug responses
 *
 * USAGE:
 * const name: ScreenName = screenNameContract.parse('MainScreen');
 * // Returns validated ScreenName branded string
 */

import { z } from 'zod';

export const screenNameContract = z.string().min(1).brand<'ScreenName'>();

export type ScreenName = z.infer<typeof screenNameContract>;
