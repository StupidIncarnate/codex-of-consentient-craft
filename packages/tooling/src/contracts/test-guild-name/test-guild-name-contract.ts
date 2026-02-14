/**
 * PURPOSE: Defines a branded string type for test guild names with validation.
 *
 * USAGE:
 * const guildName = testGuildNameContract.parse('my-test-guild');
 * // Returns: TestGuildName (branded non-empty string)
 */
import { z } from 'zod';

export const testGuildNameContract = z.string().min(1).brand<'TestGuildName'>();

export type TestGuildName = z.infer<typeof testGuildNameContract>;
