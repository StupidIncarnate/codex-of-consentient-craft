/**
 * PURPOSE: Defines a single `tailFile` call site (from `#gateway/node/fs`) extracted from source text
 *
 * USAGE:
 * tailFileCallContract.parse({ filePathArg: '/path/to/file.jsonl' });
 * // Returns validated TailFileCall
 */

import { z } from 'zod';
import { contentTextContract } from '../content-text/content-text-contract';

export const tailFileCallContract = z.object({
  filePathArg: contentTextContract,
});

export type TailFileCall = z.infer<typeof tailFileCallContract>;
