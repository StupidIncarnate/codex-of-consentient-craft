/**
 * PURPOSE: The exact string a tool-result surface is about to draw, which is not always the reply a
 * tool sent — a collapsed row draws a `TruncatedContent` preview and an open one draws the whole
 * `ToolResultContent`. Re-branding both through here is what lets one renderer serve every surface
 * without either brand leaking into the other's domain, and it is deliberately a plain string: half
 * a JSON object is a legitimate value here, because a preview is allowed to cut mid-token.
 *
 * USAGE:
 * toolResultDisplayContentContract.parse(toolResult.content);
 * // Returns ToolResultDisplayContent branded string
 */

import { z } from 'zod';

export const toolResultDisplayContentContract = z.string().brand<'ToolResultDisplayContent'>();

export type ToolResultDisplayContent = z.infer<typeof toolResultDisplayContentContract>;
