/**
 * PURPOSE: The shape a tool result takes once it turns out to have been a JSON object all along,
 * which is what lets a renderer walk the reply property by property instead of handing the reader
 * one escaped blob. Its counterpart on the call side is `parsedToolInputContract`; keep them
 * separate so the field ordering and labelling a call summary needs never leaks onto the answer.
 *
 * USAGE:
 * parsedToolResultContract.parse(JSON.parse(rawJson));
 * // Returns ParsedToolResult — a Record<ToolResultKey, unknown>
 */

import { z } from 'zod';

import { toolResultKeyContract } from '../tool-result-key/tool-result-key-contract';

export const parsedToolResultContract = z.record(toolResultKeyContract, z.unknown());

export type ParsedToolResult = z.infer<typeof parsedToolResultContract>;
