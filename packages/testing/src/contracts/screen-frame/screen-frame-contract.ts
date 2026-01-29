/**
 * PURPOSE: Validates raw terminal output captured from CLI
 *
 * USAGE:
 * const frame = screenFrameContract.parse('terminal output here');
 * // Returns validated ScreenFrame branded type
 */

import { z } from 'zod';

export const screenFrameContract = z.string().brand<'ScreenFrame'>();

export type ScreenFrame = z.infer<typeof screenFrameContract>;
