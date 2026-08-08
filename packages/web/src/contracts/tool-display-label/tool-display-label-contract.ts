/**
 * PURPOSE: The scannable name a collapsed tool row puts in its bold slot. Reach for this over the
 * raw `toolName` on a ChatEntry whenever the value is being shown to a human — the two diverge on
 * purpose, because "Bash" and "mcp__dungeonmaster__discover" say nothing about the work done.
 *
 * USAGE:
 * toolDisplayLabelContract.parse('git diff');
 * // Returns: ToolDisplayLabel branded string
 */

import { z } from 'zod';

export const toolDisplayLabelContract = z.string().min(1).brand<'ToolDisplayLabel'>();

export type ToolDisplayLabel = z.infer<typeof toolDisplayLabelContract>;
