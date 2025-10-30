/**
 * PURPOSE: Defines a branded string type for test project names with validation.
 *
 * USAGE:
 * const projectName = testProjectNameContract.parse('my-test-project');
 * // Returns: TestProjectName (branded non-empty string)
 */
import { z } from 'zod';

export const testProjectNameContract = z.string().min(1).brand<'TestProjectName'>();

export type TestProjectName = z.infer<typeof testProjectNameContract>;
