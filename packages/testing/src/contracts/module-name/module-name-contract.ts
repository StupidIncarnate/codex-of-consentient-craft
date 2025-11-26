/**
 * PURPOSE: Validates npm module names used in jest.mock() calls
 *
 * USAGE:
 * moduleNameContract.parse('axios');
 * // Returns validated ModuleName branded type
 */

import { z } from 'zod';

export const moduleNameContract = z.string().min(1).brand<'ModuleName'>();

export type ModuleName = z.infer<typeof moduleNameContract>;
