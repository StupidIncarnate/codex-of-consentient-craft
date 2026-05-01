/**
 * PURPOSE: Defines a single fsWatchTailAdapter call site extracted from source text
 *
 * USAGE:
 * fsWatchTailCallContract.parse({ filePathArg: '/path/to/file.jsonl' });
 * // Returns validated FsWatchTailCall
 */

import { z } from 'zod';
import { contentTextContract } from '../content-text/content-text-contract';

export const fsWatchTailCallContract = z.object({
  filePathArg: contentTextContract,
});

export type FsWatchTailCall = z.infer<typeof fsWatchTailCallContract>;
