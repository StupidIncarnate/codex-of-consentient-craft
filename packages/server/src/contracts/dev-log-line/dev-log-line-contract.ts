/**
 * PURPOSE: Defines a branded string type for formatted dev log output lines
 *
 * USAGE:
 * devLogLineContract.parse('◂  chat-output  proc:1925f6f6  assistant/tool_use  Read');
 * // Returns: DevLogLine branded string
 */

import { z } from 'zod';

export const devLogLineContract = z.string().brand<'DevLogLine'>();

export type DevLogLine = z.infer<typeof devLogLineContract>;
