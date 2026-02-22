/**
 * PURPOSE: Defines a branded string type for dropdown select option values
 *
 * USAGE:
 * dropdownOptionContract.parse('high');
 * // Returns: DropdownOption branded string
 */

import { z } from 'zod';

export const dropdownOptionContract = z.string().min(1).brand<'DropdownOption'>();

export type DropdownOption = z.infer<typeof dropdownOptionContract>;
