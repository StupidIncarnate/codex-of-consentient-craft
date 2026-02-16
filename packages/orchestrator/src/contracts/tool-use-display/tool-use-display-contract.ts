/**
 * PURPOSE: Defines a branded string type for formatted tool use display text
 *
 * USAGE:
 * const display: ToolUseDisplay = toolUseDisplayContract.parse('[Bash]');
 * // Returns a branded ToolUseDisplay string type
 */

import { z } from 'zod';

export const toolUseDisplayContract = z.string().min(1).brand<'ToolUseDisplay'>();

export type ToolUseDisplay = z.infer<typeof toolUseDisplayContract>;
