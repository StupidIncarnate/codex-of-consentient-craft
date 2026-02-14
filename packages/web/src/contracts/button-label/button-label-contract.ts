/**
 * PURPOSE: Defines a branded string type for button label text with length constraints
 *
 * USAGE:
 * buttonLabelContract.parse('CREATE');
 * // Returns: ButtonLabel branded string
 */

import { z } from 'zod';

const MAX_BUTTON_LABEL_LENGTH = 50;

export const buttonLabelContract = z
  .string()
  .min(1)
  .max(MAX_BUTTON_LABEL_LENGTH)
  .brand<'ButtonLabel'>();

export type ButtonLabel = z.infer<typeof buttonLabelContract>;
