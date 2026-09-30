/**
 * PURPOSE: Defines a single `tailFile` call site (from `#gateway/node/fs`) extracted from source text
 *
 * USAGE:
 * tailFileCallContract.parse({ filePathArg: '/path/to/file.jsonl' });
 * // Returns validated TailFileCall
 */

import { z } from '#gateway/npm/zod';

export const tailFileCallContract = z.object({
  filePathArg: z.string().brand<'TailFileCallFilePathArg'>(),
}).brand<'TailFileCall'>();

export type TailFileCall = z.infer<typeof tailFileCallContract>;
