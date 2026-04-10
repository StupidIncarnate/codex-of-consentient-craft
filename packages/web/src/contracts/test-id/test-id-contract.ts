/**
 * PURPOSE: Defines a branded string type for React test-id attribute values
 *
 * USAGE:
 * testIdContract.parse('CHAT_MESSAGES_AREA');
 * // Returns: TestId branded string
 */

import { z } from 'zod';

export const testIdContract = z.string().brand<'TestId'>();

export type TestId = z.infer<typeof testIdContract>;
