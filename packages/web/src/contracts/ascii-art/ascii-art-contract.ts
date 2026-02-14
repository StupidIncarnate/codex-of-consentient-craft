/**
 * PURPOSE: Defines a branded string type for ASCII art content
 *
 * USAGE:
 * asciiArtContract.parse('+-+\n| |\n+-+');
 * // Returns: AsciiArt branded string
 */

import { z } from 'zod';

export const asciiArtContract = z.string().min(1).brand<'AsciiArt'>();

export type AsciiArt = z.infer<typeof asciiArtContract>;
