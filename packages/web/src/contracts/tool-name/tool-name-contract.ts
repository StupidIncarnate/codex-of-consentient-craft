/**
 * PURPOSE: Defines the branded ToolName type used to link tool_use and tool_result entries
 *
 * USAGE:
 * toolNameContract.parse('toolu_01Lj...');
 * // Returns branded ToolName string for Map lookups across tool_use/tool_result boundaries
 */

import { z } from 'zod';

export const toolNameContract = z.string().min(1).brand<'ToolName'>();

export type ToolName = z.infer<typeof toolNameContract>;
