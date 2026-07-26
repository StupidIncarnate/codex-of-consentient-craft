/**
 * PURPOSE: Branded string naming the mocked function or spied method, shown in unmatched-call error messages
 *
 * USAGE:
 * mockFunctionNameContract.parse('readFile');
 * // Returns validated MockFunctionName branded type
 */

import { z } from 'zod';

export const mockFunctionNameContract = z.string().min(1).brand<'MockFunctionName'>();

export type MockFunctionName = z.infer<typeof mockFunctionNameContract>;
