/**
 * PURPOSE: Defines a branded string type for UI display labels and subtitle text
 *
 * USAGE:
 * displayLabelContract.parse('└─ depends on: step-1');
 * // Returns: DisplayLabel branded string
 */

import { z } from 'zod';

export const displayLabelContract = z.string().brand<'DisplayLabel'>();

export type DisplayLabel = z.infer<typeof displayLabelContract>;
