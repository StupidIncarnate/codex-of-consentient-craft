/**
 * PURPOSE: Defines a branded string type for newline-delimited JSON lines from Claude stream output
 *
 * USAGE:
 * streamJsonLineContract.parse('{"type":"init","session_id":"abc-123"}');
 * // Returns: StreamJsonLine branded string
 */

import { z } from 'zod';

export const streamJsonLineContract = z.string().min(1).brand<'StreamJsonLine'>();

export type StreamJsonLine = z.infer<typeof streamJsonLineContract>;
