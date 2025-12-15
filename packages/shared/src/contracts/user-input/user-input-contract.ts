/**
 * PURPOSE: Defines a branded string type for user input text
 *
 * USAGE:
 * const input: UserInput = userInputContract.parse('user text');
 * // Returns a branded UserInput string type
 */
import { z } from 'zod';

export const userInputContract = z.string().brand<'UserInput'>();

export type UserInput = z.infer<typeof userInputContract>;
