/**
 * PURPOSE: Defines the structure and validation for CLI debug mode screen elements
 *
 * USAGE:
 * screenElementContract.parse({type: 'text', content: 'Hello'});
 * // Returns validated ScreenElement object
 */
import { z } from 'zod';

export const screenElementContract = z.object({
  type: z.enum(['text', 'input', 'menuItem']).brand<'ScreenElementType'>(),
  content: z.string().brand<'ScreenElementContent'>(),
  selected: z.boolean().optional(),
});
export type ScreenElement = z.infer<typeof screenElementContract>;
