/**
 * PURPOSE: Defines a branded string type for keys within a parsed tool input record
 *
 * USAGE:
 * toolInputKeyContract.parse('command');
 * // Returns ToolInputKey branded string
 */

import { z } from 'zod';

export const toolInputKeyContract = z.string().brand<'ToolInputKey'>();

export type ToolInputKey = z.infer<typeof toolInputKeyContract>;
