/**
 * PURPOSE: Defines a branded string type for content text in tool call responses
 *
 * USAGE:
 * const text: ContentText = contentTextContract.parse('Result text');
 * // Returns a branded ContentText string type
 */
import { z } from 'zod';

export const contentTextContract = z.string().brand<'ContentText'>();

export type ContentText = z.infer<typeof contentTextContract>;
