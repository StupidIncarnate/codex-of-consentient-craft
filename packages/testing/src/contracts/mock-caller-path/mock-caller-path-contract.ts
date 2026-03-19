/**
 * PURPOSE: Branded string identifying the adapter file that called registerMock, derived from stack trace basename
 *
 * USAGE:
 * mockCallerPathContract.parse('child-process-exec-file-adapter');
 * // Returns validated MockCallerPath branded type
 */

import { z } from 'zod';

export const mockCallerPathContract = z.string().brand<'MockCallerPath'>();

export type MockCallerPath = z.infer<typeof mockCallerPathContract>;
