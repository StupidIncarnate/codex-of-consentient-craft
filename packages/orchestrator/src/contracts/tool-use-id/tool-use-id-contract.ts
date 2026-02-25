/**
 * PURPOSE: Defines a branded string type for Claude tool_use ID values that correlate assistant tool_use with user tool_result entries
 *
 * USAGE:
 * toolUseIdContract.parse('toolu_01EaCJyt5y8gzMNyGYarwUDZ');
 * // Returns branded ToolUseId
 */

import { z } from 'zod';

export const toolUseIdContract = z.string().min(1).brand<'ToolUseId'>();

export type ToolUseId = z.infer<typeof toolUseIdContract>;
