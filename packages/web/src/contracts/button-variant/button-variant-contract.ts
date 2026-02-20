/**
 * PURPOSE: Defines a branded enum type for button visual variants
 *
 * USAGE:
 * buttonVariantContract.parse('primary');
 * // Returns: ButtonVariant branded string
 */

import { z } from 'zod';

export const buttonVariantContract = z
  .enum(['primary', 'ghost', 'danger'])
  .brand<'ButtonVariant'>();

export type ButtonVariant = z.infer<typeof buttonVariantContract>;
