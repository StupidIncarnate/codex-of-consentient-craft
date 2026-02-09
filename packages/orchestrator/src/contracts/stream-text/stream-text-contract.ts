/**
 * PURPOSE: Defines a branded string type for text content extracted from Claude stream-json output
 *
 * USAGE:
 * const text: StreamText = streamTextContract.parse('Hello from Claude');
 * // Returns a branded StreamText string type
 */

import { z } from 'zod';

export const streamTextContract = z.string().brand<'StreamText'>();

export type StreamText = z.infer<typeof streamTextContract>;
