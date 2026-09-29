/**
 * PURPOSE: Defines a single file-write gateway call site (`appendFile`, `writeFile`, `ensureDir`)
 * extracted from source text; `adapter` carries the gateway's exported name
 *
 * USAGE:
 * fileWriteCallContract.parse({ adapter: 'writeFile', filePathArg: '/quest.json' });
 * // Returns validated FileWriteCall
 */

import { z } from '#gateway/npm/zod';
import { contentTextContract } from '../content-text/content-text-contract';

export const fileWriteCallContract = z.object({
  adapter: contentTextContract,
  filePathArg: contentTextContract,
});

export type FileWriteCall = z.infer<typeof fileWriteCallContract>;
