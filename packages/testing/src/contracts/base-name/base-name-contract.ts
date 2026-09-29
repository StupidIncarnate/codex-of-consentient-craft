/**
 * PURPOSE: Validates base name for test project naming
 *
 * USAGE:
 * baseNameContract.parse('my-test');
 * // Returns validated BaseName branded type
 */

import { z } from '#gateway/npm/zod';

export const baseNameContract = z.string().min(1).brand<'BaseName'>();

export type BaseName = z.infer<typeof baseNameContract>;
