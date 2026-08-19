/**
 * PURPOSE: Names one property of a tool's ANSWER, for the label a formatted result puts above the
 * value that property held. Reach for `toolInputKeyContract` instead on the call side — the two are
 * branded apart so a key lifted off the arguments a tool was invoked with cannot be handed to the
 * renderer as if it named part of the reply.
 *
 * USAGE:
 * toolResultKeyContract.parse('prompt');
 * // Returns ToolResultKey branded string
 */

import { z } from 'zod';

export const toolResultKeyContract = z.string().brand<'ToolResultKey'>();

export type ToolResultKey = z.infer<typeof toolResultKeyContract>;
