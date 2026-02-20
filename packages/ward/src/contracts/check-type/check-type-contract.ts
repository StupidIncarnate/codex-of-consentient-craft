/**
 * PURPOSE: Defines the valid check types that ward can execute
 *
 * USAGE:
 * checkTypeContract.parse('lint');
 * // Returns: CheckType branded string
 */

import { z } from 'zod';

export const checkTypeContract = z.enum(['lint', 'typecheck', 'unit', 'e2e']);

export type CheckType = z.infer<typeof checkTypeContract>;
