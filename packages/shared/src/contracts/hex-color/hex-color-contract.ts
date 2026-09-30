/**
 * PURPOSE: Validates a CSS hex color value (#RRGGBB format)
 *
 * USAGE:
 * const color: HexColor = hexColorContract.parse('#ff6b35');
 * // Returns the validated hex color string
 */
import { z } from '#gateway/npm/zod';

export const hexColorContract = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/u, 'Must be a valid hex color (#RRGGBB)');

export type HexColor = z.infer<typeof hexColorContract>;
