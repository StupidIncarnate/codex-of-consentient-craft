/**
 * PURPOSE: Defines a branded string type for terminal frame content in debug responses
 *
 * USAGE:
 * const frame: TerminalFrame = terminalFrameContract.parse('...');
 * // Returns validated TerminalFrame branded string
 */

import { z } from 'zod';

export const terminalFrameContract = z.string().brand<'TerminalFrame'>();

export type TerminalFrame = z.infer<typeof terminalFrameContract>;
