/**
 * PURPOSE: Defines a branded non-empty string type used as a placeholder in the smoketest blueprint to satisfy quest contract requirements
 *
 * USAGE:
 * smoketestPlaceholderContract.parse('placeholder-value');
 * // Returns branded SmoketestPlaceholder string
 */

import { z } from 'zod';

export const smoketestPlaceholderContract = z.string().min(1).brand<'SmoketestPlaceholder'>();

export type SmoketestPlaceholder = z.infer<typeof smoketestPlaceholderContract>;
