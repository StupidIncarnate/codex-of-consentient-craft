/**
 * PURPOSE: Defines a branded string type for content type identifiers in tool responses
 *
 * USAGE:
 * const type: ContentType = contentTypeContract.parse('text');
 * // Returns a branded ContentType string type
 */
import { z } from 'zod';

export const contentTypeContract = z.string().brand<'ContentType'>();

export type ContentType = z.infer<typeof contentTypeContract>;
