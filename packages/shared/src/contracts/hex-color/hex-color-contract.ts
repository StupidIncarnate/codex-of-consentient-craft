/**
 * PURPOSE: Defines a branded string type for CSS hex color values (#RRGGBB format)
 *
 * USAGE:
 * const color: HexColor = hexColorContract.parse('#ff6b35');
 * // Returns a branded HexColor string type
 */
import { z } from 'zod';

export const hexColorContract = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/u, 'Must be a valid hex color (#RRGGBB)')
  .brand<'HexColor'>();

export type HexColor = z.infer<typeof hexColorContract>;
