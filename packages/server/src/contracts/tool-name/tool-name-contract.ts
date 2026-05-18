/**
 * PURPOSE: Defines the branded ToolName type used by the chat-output broadcaster to match Task tool_use against its later user.tool_result entry
 *
 * USAGE:
 * toolNameContract.parse('Task');
 * // Returns branded ToolName string for Set-membership lookups across tool_use/tool_result boundaries
 */

import { z } from 'zod';

export const toolNameContract = z.string().min(1).brand<'ToolName'>();

export type ToolName = z.infer<typeof toolNameContract>;
