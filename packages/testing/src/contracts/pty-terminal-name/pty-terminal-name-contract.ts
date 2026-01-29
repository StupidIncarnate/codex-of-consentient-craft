/**
 * PURPOSE: Defines the terminal name type for PTY (e.g., xterm-256color)
 *
 * USAGE:
 * const termName = ptyTerminalNameContract.parse('xterm-256color');
 * // Returns validated PtyTerminalName branded type
 */

import { z } from 'zod';

export const ptyTerminalNameContract = z.string().brand<'PtyTerminalName'>();

export type PtyTerminalName = z.infer<typeof ptyTerminalNameContract>;
