/**
 * PURPOSE: Defines a branded string type for form placeholder text
 *
 * USAGE:
 * formPlaceholderContract.parse('Enter value...');
 * // Returns: FormPlaceholder branded string
 */

import { z } from 'zod';

export const formPlaceholderContract = z.string().min(1).brand<'FormPlaceholder'>();

export type FormPlaceholder = z.infer<typeof formPlaceholderContract>;
