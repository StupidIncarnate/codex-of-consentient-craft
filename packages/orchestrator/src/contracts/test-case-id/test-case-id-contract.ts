/**
 * PURPOSE: Defines the branded UUID type for TestCase identifiers
 *
 * USAGE:
 * testCaseIdContract.parse('f47ac10b-58cc-4372-a567-0e02b2c3d479');
 * // Returns: TestCaseId branded string
 */

import { z } from 'zod';

export const testCaseIdContract = z.string().uuid().brand<'TestCaseId'>();

export type TestCaseId = z.infer<typeof testCaseIdContract>;
