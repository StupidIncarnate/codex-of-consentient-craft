/**
 * PURPOSE: Defines a branded string type for form input values
 *
 * USAGE:
 * formInputValueContract.parse('some text');
 * // Returns: FormInputValue branded string
 */

import { z } from 'zod';

export const formInputValueContract = z.string().brand<'FormInputValue'>();

export type FormInputValue = z.infer<typeof formInputValueContract>;
